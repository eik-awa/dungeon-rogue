//
//  AdBannerView.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/07/08.
//
//  画面最下部に常時表示する Unity LevelPlay(Unity Ads)バナー。
//

import SwiftUI
import Combine
import UIKit
import IronSource
import FirebaseAnalytics

/// LevelPlay の App Key。IronSource/LevelPlay ダッシュボード → Apps → App Key の値を使用。
/// Unity Dashboard の Game ID とは別の値なので注意。
let levelPlayAppKey = "278b7dd0d"

/// LevelPlay SDK の初期化状態をアプリ全体で共有する。
/// バナー広告オブジェクトは初期化完了(onInitSuccess)後に生成する必要があるため、
/// AdBannerView はこの状態を監視してから広告を生成する。
///
/// 初期化通信は起動時に広告ブロックが有効だと失敗しうる。その場合でも `isInitialized` を
/// false のまま固定せず、フォアグラウンドにいる間は指数バックオフで自動リトライし、
/// アプリ復帰時には即時リトライする(不具合①・原因A/D対策)。
final class LevelPlayAdsController: ObservableObject {
    static let shared = LevelPlayAdsController()

    /// SDK 初期化のライフサイクル。
    private enum InitState { case idle, initializing, ready, failed }

    @Published private(set) var isInitialized = false

    private var state: InitState = .idle
    private var retryCount = 0
    private var retryWorkItem: DispatchWorkItem?
    /// バックオフ待機はフォアグラウンドでのみ動作させる。
    private var isForeground = true
    /// バックグラウンドへ入った時刻。フォアグラウンド復帰時に「どれだけ長く裏にいたか」を
    /// 判定し、長時間(6時間以上)バックグラウンドにいた場合は SDK セッションが内部的に
    /// 失効している可能性を疑って再初期化する(原因E対策・後述)。
    private var backgroundedAt: Date?
    /// 「翌日(2日目)から広告が一切出なくなる」という報告への対策。原因A〜Dは全て
    /// 「初回初期化に失敗した場合の再試行」だったが、これは範囲外の症状: 初回初期化には
    /// 成功していて(state == .ready)、かつフォアグラウンド復帰の再試行(preloadIfNeeded)も
    /// 動いているのに広告が出ない、というケース。iOS はアプリをタスクキルしなくても長時間
    /// バックグラウンドのまま生存させることが多く、その間 LevelPlay 側のセッション/在庫が
    /// 内部的に失効していても、このアプリは一度 .ready になった SDK を二度と再初期化しない
    /// (ready の場合は preloadIfNeeded しか呼ばない)ため、プロセスを再起動しない限り
    /// 復旧しなかった可能性がある。長時間バックグラウンドからの復帰を「要再初期化」の
    /// シグナルとして扱うことで、タスクキルせず日をまたいだユーザーでも復旧を試みる。
    private static let staleAfter: TimeInterval = 6 * 3600
    /// forceReinitialize() の連打を防ぐクールダウン。広告ロード失敗のたびに無条件で
    /// SDK 初期化を叩き直すと、ネットワーク側から見て過剰なリクエストになり、
    /// かえって配信に悪影響が出かねない(収益に関わる分岐点のため慎重に)。
    private static let reinitCooldown: TimeInterval = 10 * 60
    private var lastForcedReinitAt: Date?

    private init() {
        // バックグラウンドに入ったらリトライを止め、次のフォアグラウンド復帰まで待つ。
        NotificationCenter.default.addObserver(
            self, selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification, object: nil)
    }

    @objc private func appDidEnterBackground() {
        isForeground = false
        backgroundedAt = Date()
        retryWorkItem?.cancel()
        retryWorkItem = nil
    }

    /// ATT の応答後に呼び出す。冪等。以降はフォアグラウンド復帰のたびに
    /// `initializeIfNeeded()` を呼んでよい(S1-2)。
    func initialize() {
        initializeIfNeeded()
    }

    /// 未初期化ならバックオフ待ちをスキップして即時リトライする。
    /// 初期化済みなら手持ちのリワード広告を必要に応じて再ロードする。
    /// ただし長時間バックグラウンドから戻った直後は、SDK セッション失効を疑って
    /// 丸ごと再初期化する(原因E対策)。
    func initializeIfNeeded() {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.isForeground = true
            let staleReturn = self.backgroundedAt.map { Date().timeIntervalSince($0) > Self.staleAfter } ?? false
            self.backgroundedAt = nil
            switch self.state {
            case .ready where staleReturn:
                self.forceReinitialize(reason: "long_background_return")
            case .ready:
                RewardedAdController.shared.preloadIfNeeded()
            case .initializing:
                break
            case .idle, .failed:
                self.retryWorkItem?.cancel()
                self.retryWorkItem = nil
                self.startInit()
            }
        }
    }

    /// state == .ready のまま広告が出せなくなっている(SDK セッションが内部的に失効した)
    /// ことを疑い、SDK を丸ごと再初期化する。長時間バックグラウンド復帰時(原因E対策)に
    /// 加えて、個別の広告(バナー/リワード)が続けて失敗した時にも呼ばれる。
    /// reinitCooldown 未満の間隔で連打されないようガードする(収益に関わる分岐点のため、
    /// ネットワークへの過剰リクエストを避ける)。
    func forceReinitialize(reason: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            if let last = self.lastForcedReinitAt, Date().timeIntervalSince(last) < Self.reinitCooldown {
                return
            }
            if case .initializing = self.state { return }
            print("[AdBanner] re-initializing SDK session (reason: \(reason))")
            Analytics.logEvent("ad_sdk_stale_reinit", parameters: ["reason": reason])
            self.lastForcedReinitAt = Date()
            self.state = .idle
            self.startInit()
        }
    }

    private func startInit() {
        #if targetEnvironment(simulator)
        // シミュレータは IDFA が無くテストデバイス登録が効かないため SDK を起動しない。
        print("[AdBanner] simulator: skipping SDK init")
        return
        #else
        state = .initializing
        // Test Suite はこのメタデータを有効にしてから初期化しないと起動できない。
        // デバッグ端末以外では本番の広告配信に影響しないよう有効化しない。
        if DebugDeviceConfig.isDebugDevice {
            LevelPlay.setMetaDataWithKey("is_test_suite", value: "enable")
        }
        let request = LPMInitRequestBuilder(appKey: levelPlayAppKey).build()
        LevelPlay.initWith(request) { [weak self] _, error in
            DispatchQueue.main.async {
                guard let self else { return }
                if let error = error {
                    print("[AdBanner] init failed: \(error)")
                    self.state = .failed
                    self.scheduleRetry()
                    return
                }
                print("[AdBanner] init success")
                self.state = .ready
                self.retryCount = 0
                self.retryWorkItem?.cancel()
                self.retryWorkItem = nil
                self.isInitialized = true
                RewardedAdController.shared.preload()
                // デバッグ端末でのみ、アダプター(Unity Ads等)が正しく統合されているかを
                // コンソールに出力する(本番端末では余計なログを出さないよう限定)。
                if DebugDeviceConfig.isDebugDevice {
                    LevelPlay.validateIntegration()
                }
            }
        }
        #endif
    }

    /// 初期化失敗時、指数バックオフで再試行する(5→15→30→60秒、以降60秒固定)。
    /// 上限回数は設けない。フォアグラウンドにいる間だけ動作する。
    private func scheduleRetry() {
        guard isForeground else { return }
        let delays: [TimeInterval] = [5, 15, 30, 60]
        let delay = delays[min(retryCount, delays.count - 1)]
        retryCount += 1
        let work = DispatchWorkItem { [weak self] in
            guard let self else { return }
            if case .failed = self.state { self.startInit() }
        }
        retryWorkItem = work
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
    }

    /// デバッグ端末(DebugDeviceConfig.isDebugDevice)からのみ呼び出す想定。
    /// LevelPlay の Test Suite を起動し、テストモードで広告在庫を確認できるようにする。
    func launchTestSuite() {
        guard let vc = UIApplication.shared.kwRootViewController else { return }
        LevelPlay.launchTestSuite(vc)
    }
}

/// LevelPlay バナー(320x50)を SwiftUI へ橋渡しする。
private struct AdBannerUIView: UIViewRepresentable {
    let adUnitID: String

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> LPMBannerAdView {
        let config = LPMBannerAdViewConfigBuilder().set(adSize: .banner()).build()
        let banner = LPMBannerAdView(adUnitId: adUnitID, config: config)
        banner.setDelegate(context.coordinator)
        if let vc = UIApplication.shared.kwRootViewController {
            banner.loadAd(with: vc)
            context.coordinator.requestedLoad = true
        }
        return banner
    }

    func updateUIView(_ uiView: LPMBannerAdView, context: Context) {
        // ルート VC がまだ無かった場合に備えて、表示更新時に補う。
        if !context.coordinator.requestedLoad, let vc = UIApplication.shared.kwRootViewController {
            uiView.loadAd(with: vc)
            context.coordinator.requestedLoad = true
        }
    }

    final class Coordinator: NSObject, LPMBannerAdViewDelegate {
        var requestedLoad = false
        /// 連続ロード失敗回数。LevelPlay 公式ドキュメントは「バナーの更新間隔はダッシュボード側の
        /// 設定に従い SDK が自動で行うので、loadAd を自前で再試行してはいけない
        /// (SDK 内蔵の自動更新と衝突しうる)」と明記しているため、ここでは loadAd を
        /// 呼び直さない。あくまで「SDK 自身の自動更新サイクルが何度も失敗し続けている」ことを
        /// 検知するためだけにカウントし、3回連続で失敗したら SDK セッションの失効を疑って
        /// LevelPlayAdsController に丸ごと再初期化させる(loadAd の手動再試行とは別物)。
        private var consecutiveFailures = 0

        func didLoadAd(with adInfo: LPMAdInfo) {
            print("[AdBanner] banner loaded: \(adInfo.adUnitId)")
            Analytics.logEvent("banner_ad_result", parameters: ["result": "loaded"])
            consecutiveFailures = 0
        }
        func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {
            print("[AdBanner] banner load failed (\(adUnitId)): \(error)")
            // 「2日目から広告が全く出ない」の原因追跡用(原因E仮説の検証データ)。
            // reward_ad_result と違い、これまでバナーの失敗はログに残っていなかった。
            Analytics.logEvent("banner_ad_result", parameters: [
                "result": "load_failed",
                "error": String(describing: error).prefix(100).description,
            ])
            escalateIfRepeated()
        }
        func didDisplayAd(with adInfo: LPMAdInfo) {
            print("[AdBanner] banner displayed")
        }
        func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {
            print("[AdBanner] banner display failed: \(error)")
            Analytics.logEvent("banner_ad_result", parameters: [
                "result": "display_failed",
                "error": String(describing: error).prefix(100).description,
            ])
            escalateIfRepeated()
        }
        func didClickAd(with adInfo: LPMAdInfo) {}
        func didLeaveApp(with adInfo: LPMAdInfo) {}
        func didExpandAd(with adInfo: LPMAdInfo) {}
        func didCollapseAd(with adInfo: LPMAdInfo) {}

        private func escalateIfRepeated() {
            consecutiveFailures += 1
            if consecutiveFailures >= 3 {
                // バナーの自動更新サイクル自体が何度も失敗しているなら、個別のロード問題ではなく
                // SDK セッション側を疑う。次に成功すれば consecutiveFailures は didLoadAd で
                // リセットされる。
                LevelPlayAdsController.shared.forceReinitialize(reason: "banner_repeated_failure")
            }
        }
    }
}

/// シミュレータ用のダミーバナー。
private struct SimulatorAdPlaceholder: View {
    var body: some View {
        ZStack {
            Color(white: 0.18)
            Text("テストモード")
                .font(.system(size: 11, weight: .regular, design: .monospaced))
                .foregroundColor(Color(white: 0.55))
        }
    }
}

/// デバッグ端末用のプレースホルダー。タップすると LevelPlay の Test Suite が起動する。
private struct DebugAdPlaceholder: View {
    var body: some View {
        ZStack {
            Color(white: 0.18)
            Text("テストモード")
                .font(.system(size: 11, weight: .regular, design: .monospaced))
                .foregroundColor(Color(white: 0.55))
        }
        .contentShape(Rectangle())
        .onTapGesture {
            LevelPlayAdsController.shared.launchTestSuite()
        }
    }
}

/// SDK 初期化完了後にバナーを表示する。シミュレータではプレースホルダーを表示。
/// デバッグ端末(DebugDeviceConfig.isDebugDevice)では本番広告を配信せずプレースホルダーを表示する。
struct AdBannerView: View {
    let adUnitID: String
    @ObservedObject private var ads = LevelPlayAdsController.shared

    var body: some View {
        #if targetEnvironment(simulator)
        SimulatorAdPlaceholder()
        #else
        if DebugDeviceConfig.isDebugDevice {
            DebugAdPlaceholder()
        } else if ads.isInitialized {
            AdBannerUIView(adUnitID: adUnitID)
        } else {
            // 初期化完了までの数秒、最下部が黒帯にならないよう背景色で埋める(S3-3)。
            Color(red: 0x0a / 255, green: 0x12 / 255, blue: 0x0e / 255)
        }
        #endif
    }
}

extension UIApplication {
    /// 現在キーになっているウインドウのルート ViewController。
    var kwRootViewController: UIViewController? {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }?
            .rootViewController
    }
}
