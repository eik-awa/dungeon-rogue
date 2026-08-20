//
//  ConsentManager.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/08/20.
//
//  GDPR(EEA/UK)・CCPA等(米国州法)向けの同意収集(InMobi Choice CMP)。
//  IAB TCF v2.2 / Google Additional Consent 準拠のため、LevelPlay SDK(7.7.0以降)は
//  ここで集めた GDPR 同意を自動的に読み取ってネットワークへ反映する。
//  CCPA/米国州法については didReceiveUSRegulationsConsent の結果を
//  明示的に LPMPrivacySettings.setCCPA へ渡す。
//
//  事前に https://choice.inmobi.com でアカウント登録し、本アプリの Bundle ID で
//  プロパティを作成して発行される p-code を `pcode` に設定しておく必要がある。
//  未設定/無効なままでも cmpDidError 経由でアプリの起動は止めない。
//

import Foundation
import UIKit
import InMobiCMP
import IronSource
import FirebaseAnalytics

final class ConsentManager: NSObject, ChoiceCmpDelegate, CCPADelegate {
    static let shared = ConsentManager()

    /// choice.inmobi.com のダッシュボードで Bundle ID(eik-awa.rogue-like-dungeon)に
    /// 紐づけて発行された App Key(= p-code)。
    private let pcode = "e_de1zrrLkmzK"

    private var completion: ((Bool) -> Void)?
    private var didComplete = false

    /// GDPR が適用される場合、TCF Purpose 1(端末への情報保存・アクセス)への同意が
    /// 実際に得られているか。GDPR 非適用地域や、IAB ベンダー同意が一度も届いていない
    /// (=GDPR 対象外と判断された)場合は true のままにしておく。
    /// Firebase Analytics は setAnalyticsCollectionEnabled を呼んだだけでは同意状態を
    /// 見てくれない(TCF 文字列を自動で読む ironSource/LevelPlay とは違う)ため、
    /// ここで明示的にオプトイン同意の有無を反映する。
    private(set) var canEnableAnalytics = true

    private override init() {
        super.init()
    }

    /// アプリ起動時、ATT より前に一度だけ呼ぶ。EEA/UK/米国州法等で同意画面の表示が
    /// 必要な場合はそれが閉じられるまで待ち、不要な場合は即座に completion を呼ぶ。
    /// タイムアウト・エラー時もアプリの起動は止めないが、completion には
    /// 「CMP が実際に応答したか(true)/オフライン等でタイムアウトしたか(false)」を渡す。
    /// false の場合、呼び出し側は同意状況が未確定であることを踏まえ、
    /// 計測・広告配信の有効化を見送るべき(次回起動時に自動的に再試行される)。
    func requestConsentIfNeeded(completion: @escaping (Bool) -> Void) {
        self.completion = completion
        self.didComplete = false

        // ネットワーク不調などで CMP からの応答が一切来ない場合の保険。
        // このタイムアウト経由の完了は「同意未確定」として resolved=false を返す。
        DispatchQueue.main.asyncAfter(deadline: .now() + 8) { [weak self] in
            self?.finishOnce(resolved: false)
        }

        ChoiceCmp.shared.startChoice(pcode: pcode, delegate: self, ccpaDelegate: self,
                                      shouldDisplayIDFA: false, style: Self.style)
    }

    /// ゲーム本体の配色(墨緑の闇 × 蛍の灯)に合わせた同意画面のスタイル。ライト/ダーク両方に
    /// 同じダーク配色を指定し、preferredThemeMode を .dark に固定している。
    private static let style: ChoiceStyle = {
        let colors = ChoiceColor()
        colors.globalBackgroundColor = "#0f1a14"
        colors.titleTextColor = "#e8b44a"
        colors.bodyTextColor = "#e9e4d3"
        colors.menuTextColor = "#e9e4d3"
        colors.tabBackgroundColor = "#141f18"
        colors.tabTextColor = "#9db4a6"
        colors.dividerColor = "#2a352e"
        colors.linkTextColor = "#e8b44a"
        colors.toggleActiveColor = "#e8b44a"
        colors.toggleInactiveColor = "#4a564d"
        colors.searchBarBackgroundColor = "#141f18"
        colors.searchBarForegroundColor = "#e9e4d3"
        colors.infoButtonForegroundColor = "#e8b44a"
        colors.buttonBackgroundColor = "#e8b44a"
        colors.buttonTextColor = "#141f18"
        colors.buttonDisabledBackgroundColor = "#3a4a3f"
        colors.buttonDisabledTextColor = "#9db4a6"
        return ChoiceStyle(preferredThemeMode: .dark, lightModeColors: colors, darkModeColors: colors)
    }()

    /// 設定画面などから、ユーザーが後から同意の選択をやり直せるようにする。
    func reopenConsentUI() {
        ChoiceCmp.shared.forceDisplayUI()
    }

    /// GDPR(EEA/UK)または米国州法(CCPA等)が実際にこの端末のユーザーへ適用されるか。
    /// 日本など対象地域外のユーザーには「同意設定を管理」の項目自体を出す必要がないため、
    /// 設定画面側の表示判定に使う。startChoice が一度も成功していない場合は false を返す。
    var isRegulationApplicable: Bool {
        let info = ChoiceCmp.shared.ping()
        guard info.cmpLoaded else { return false }
        return info.gdprApplies == true || info.usRegulationApplies
    }

    /// 開発用: IAB TCF の同意データを消去して次回起動時に再度同意画面を表示させる。
    func resetConsent() {
        let keys = [
            "IABTCF_TCString", "IABTCF_gdprApplies", "IABTCF_CmpSdkID",
            "IABTCF_CmpSdkVersion", "IABTCF_PolicyVersion", "IABTCF_PurposeConsents",
            "IABTCF_VendorConsents", "IABTCF_VendorLegitimateInterests",
            "IABTCF_PurposeLegitimateInterests", "IABTCF_SpecialFeaturesOptIns",
            "USPrivacy_String", "IABGPP_HDR_GppString"
        ]
        keys.forEach { UserDefaults.standard.removeObject(forKey: $0) }
        UserDefaults.standard.synchronize()
        print("[Consent] consent data cleared — relaunch to show consent UI again")
    }

    private func finishOnce(resolved: Bool) {
        guard !didComplete else { return }
        didComplete = true
        let cb = completion
        completion = nil
        DispatchQueue.main.async { cb?(resolved) }
    }

    // MARK: - ChoiceCmpDelegate

    func cmpDidLoad(info: PingResponse) {
        print("[Consent] cmpDidLoad: displayStatus=\(info.displayStatus.rawValue) gdpr=\(info.gdprApplies)")
        if info.displayStatus != .visible {
            finishOnce(resolved: true)
        }
    }

    func didReceiveIABVendorConsent(gdprData: GDPRData, updated: Bool) {
        print("[Consent] IAB vendor consent updated=\(updated)")
        guard gdprData.gdprApplies ?? false else { return }
        let purpose1Granted = gdprData.purpose.consents["1"] ?? false
        canEnableAnalytics = purpose1Granted
        print("[Consent] GDPR applies — purpose1(device storage/access) granted=\(purpose1Granted)")
        // 設定画面から同意をやり直した場合など、初回起動後の変更もその場で即座に反映する。
        // setAnalyticsCollectionEnabled は同意状態を自動で見てくれないため、明示的に呼ぶ必要がある。
        Analytics.setAnalyticsCollectionEnabled(purpose1Granted)
    }

    func didReceiveNonIABVendorConsent(nonIabData: NonIABData, updated: Bool) {
        print("[Consent] Non-IAB vendor consent updated=\(updated)")
    }

    func didReceiveAdditionalConsent(acData: ACData, updated: Bool) {
        print("[Consent] Additional consent updated=\(updated)")
    }

    func cmpDidError(error: Error) {
        print("[Consent] ERROR: \(error)")
        finishOnce(resolved: false)
    }

    func didReceiveUSRegulationsConsent(usRegData: USRegulationsData) {
        print("[Consent] US regulations: saleOptOut=\(usRegData.SaleOptOut) sharingOptOut=\(usRegData.SharingOptOut)")
        let optedOut = usRegData.SaleOptOut != 0 || usRegData.SharingOptOut != 0
        LPMPrivacySettings.setCCPA(optedOut)
    }

    func didReceiveActionButtonTap(action: ActionButtons) {
        print("[Consent] action button tapped: \(action)")
    }

    func cmpUIStatusChanged(info: DisplayInfo) {
        print("[Consent] UI status changed: displayStatus=\(info.displayStatus.rawValue)")
        if info.displayStatus == .dismissed || info.displayStatus == .hidden {
            finishOnce(resolved: true)
        }
    }

    func userDidMoveToOtherState() {
        print("[Consent] userDidMoveToOtherState")
    }

    // MARK: - CCPADelegate

    func didReceiveCCPAConsent(string: String) {
        // didReceiveUSRegulationsConsent 側の構造化データで setCCPA 済みのため、ここでは記録のみ。
        print("[Consent] US privacy string: \(string)")
    }
}
