//
//  RewardedAdController.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/08/18.
//
//  リワード広告(Unity LevelPlay)。1日3回までの制限は JS 側(kiriwatari-no-mori.jsx)で管理し、
//  ネイティブ側は「表示できるかどうか」と「視聴結果(reward / dismissed / unavailable / timeout)」だけを担当する。
//

import Foundation
import UIKit
import IronSource
import FirebaseAnalytics

/// LevelPlay Dashboard で発行したリワード広告の Ad Unit ID。
let rewardedAdUnitID = "dmywhrj06urqpzsi"

/// リワード広告の視聴結果。JS 側 `__onRewardAdResult__` にそのまま rawValue で渡す。
/// - rewarded: 視聴完了。報酬付与・回数消費の対象。
/// - dismissed: 視聴途中で閉じた。報酬なし・回数消費なし。
/// - nofill: 配信可能な広告がない(在庫不足。SDK エラーコード 509 / 1058)。ユーザー側の環境は原因ではない。
/// - nonetwork: 通信なし(SDK エラーコード 520)。
/// - unavailable: 広告をロードできなかった(上記以外の原因。広告ブロック等を案内する)。
/// - timeout: ロード待ちが規定時間を超えた。原因コードが分からないまま時間切れになった場合。
enum RewardAdResult: String {
    case rewarded
    case dismissed
    case nofill
    case nonetwork
    case unavailable
    case timeout

    /// SDK のエラーコードから分類する(IronSource ISError.h より:
    /// 509 = ERROR_CODE_NO_ADS_TO_SHOW, 1058 = ERROR_RV_LOAD_NO_FILL, 520 = ERROR_NO_INTERNET_CONNECTION)。
    static func classify(code: Int) -> RewardAdResult {
        switch code {
        case 509, 1058: return .nofill
        case 520: return .nonetwork
        default: return .unavailable
        }
    }
}

/// リワード広告のロード・表示・コールバックを一元管理する。
final class RewardedAdController: NSObject, LPMRewardedAdDelegate {
    static let shared = RewardedAdController()

    private var ad: LPMRewardedAd?
    private var onResult: ((RewardAdResult) -> Void)?
    /// show() がロード完了前に呼ばれた場合に保持する待機中コールバック。
    private var pendingCompletion: ((RewardAdResult) -> Void)?

    /// ロード開始時刻。`didLoadAd` / `didFailToLoadAd` / `didFailToDisplayAd` で nil に戻す。
    /// 20秒経過してもどちらのコールバックも返らない場合(広告ブロックによるパケット破棄など)は
    /// スタックとみなし、`isLoading` を false 扱いにして再ロードを許可する(原因B対策)。
    /// 以前は45秒だったが、show() 側の15秒待ちより長く、押すたびに無駄な15秒待ち→
    /// タイムアウトを繰り返す余地があったため短縮した。
    private var loadStartedAt: Date?
    private var isLoading: Bool {
        guard let t = loadStartedAt else { return false }
        if Date().timeIntervalSince(t) > 20 { return false }
        return true
    }

    /// 現在の `ad` が読み込み完了した時刻。`didLoadAd` で更新する。
    /// 読み込みから時間が経ちすぎた広告は isAdReady() が true のままでも作り直す(死ぬ前に
    /// 新しい広告を用意しておくのが狙い)。
    private var adLoadedAt: Date?
    private static let maxAdAge: TimeInterval = 30 * 60
    private var isStale: Bool {
        guard let t = adLoadedAt else { return false }
        return Date().timeIntervalSince(t) > Self.maxAdAge
    }

    /// プレイ中も先読みを保つための定期タイマー(SDK 初期化完了後に一度だけ開始する)。
    /// 広告を表示中・待機中は動かさない(show() の最中に横から ad を差し替えないため)。
    private var refreshTimer: Timer?

    /// show() リクエストごとに採番する連番。タイムアウトを「そのリクエスト」に紐づける(原因C対策)。
    private var requestSeq: UInt64 = 0
    private var pendingRequestID: UInt64?
    /// show() が待機を始めた際の15秒の期限。didFailToLoadAd 側で「まだ何秒残っているか」の
    /// 判定に使う(残りが短ければ再読み込みせず素直に失敗を返す)。
    private var pendingRequestDeadline: Date?

    /// didRewardAd / didCloseAd は公式ドキュメントでも「順序は保証されない
    /// (didRewardAd が didCloseAd より後に届くことがある)」と明記されている。
    /// didCloseAd を先に受け取っても即座に .dismissed 扱いにはせず、このフラグで
    /// 「今回の視聴で既に didRewardAd が届いたか」を追跡する(show() のたびにリセット)。
    private var pendingRewardGranted = false

    /// 連続ロード失敗回数。「失敗したら確実に広告が行き渡るように」という要望への対応。
    /// didFailToLoadAd のたびに preloadIfNeeded で再ロードは試みているが、それでも
    /// 3回連続で失敗する場合は個別のロード問題ではなく SDK セッション側の失効を疑い、
    /// LevelPlayAdsController に丸ごと再初期化させる(バナー側と同じ考え方)。
    private var consecutiveLoadFailures = 0

    private override init() {
        super.init()
    }

    /// LevelPlay SDK 初期化完了後に一度呼び、次に見せる広告を先読みしておく。
    func preload() {
        guard !isLoading else { return }
        loadStartedAt = Date()
        let newAd = LPMRewardedAd(adUnitId: rewardedAdUnitID)
        newAd.setDelegate(self)
        ad = newAd
        newAd.loadAd()
    }

    /// 手持ちの広告が無ければ(または未ロードなら)再ロードする。
    /// フォアグラウンド復帰時などに呼び、広告ブロック解除後の復旧トリガーにする(S1-2)。
    /// 読み込みから30分以上たった広告は、isAdReady() が true のままでも古いとみなして作り直す。
    func preloadIfNeeded() {
        if let ad = ad, ad.isAdReady(), !isStale { return }
        if isStale {
            ad = nil
            adLoadedAt = nil
        }
        preload()
    }

    /// プレイ中も先読みを保つための定期タイマーを開始する(冪等・SDK 初期化完了後に一度だけ呼ぶ)。
    /// 2分おきに preloadIfNeeded() を呼ぶが、アプリが前面にあり、かつ広告を表示・待機して
    /// いない間だけ実行する(show() の最中に横から ad を差し替えないため)。
    func startPeriodicPreload() {
        guard refreshTimer == nil else { return }
        let timer = Timer(timeInterval: 120, repeats: true) { [weak self] _ in
            self?.periodicPreloadTick()
        }
        // .common にしておかないと、スクロール等の UI 操作中にメインの RunLoop が
        // .default モードを離れてしまい、2分タイマーが遅延・停止することがある。
        RunLoop.main.add(timer, forMode: .common)
        refreshTimer = timer
    }

    private func periodicPreloadTick() {
        guard UIApplication.shared.applicationState == .active else { return }
        guard onResult == nil, pendingCompletion == nil else { return }
        preloadIfNeeded()
    }

    /// SDK は初期化済みのまま、リワード広告のオブジェクトだけを作り直す。
    /// forceReinitialize から呼ばれる(SDK 自体の再初期化はもう行わない)。
    func rebuildAd() {
        ad = nil
        adLoadedAt = nil
        preload()
    }

    /// 広告を表示する。結果は `RewardAdResult` でコールバックする。
    /// 広告がまだロード中の場合は最大15秒待ってから表示する。
    /// デバッグ端末(DebugDeviceConfig.isDebugDevice)では本番広告を消費せず、
    /// 数秒待って自動的に成功するだけの簡易テスト広告を表示する。
    func show(completion: @escaping (RewardAdResult) -> Void) {
        if DebugDeviceConfig.isDebugDevice {
            showDebugTestAd(completion: completion)
            return
        }
        guard let vc = UIApplication.shared.kwTopViewController else {
            completion(.unavailable)
            return
        }
        if let ad = ad, ad.isAdReady(), !isStale {
            logShowRequest(ready: true)
            onResult = completion
            pendingRequestID = nil
            pendingRewardGranted = false
            ad.showAd(viewController: vc, placementName: nil)
            return
        }
        // 広告がロード中・未ロード・古くなった(isStale)のいずれか — リクエストIDを採番し、
        // 15秒待って表示を試みる。
        logShowRequest(ready: false)
        if isStale {
            ad = nil
            adLoadedAt = nil
        }
        requestSeq += 1
        let myID = requestSeq
        pendingRequestID = myID
        pendingCompletion = completion
        pendingRequestDeadline = Date().addingTimeInterval(15)
        preload()
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
            guard let self, self.pendingRequestID == myID else { return }
            // 自分のリクエストがまだ待機中のときだけ打ち切る。
            self.pendingRequestID = nil
            self.pendingRequestDeadline = nil
            let cb = self.pendingCompletion
            self.pendingCompletion = nil
            self.logFailure(stage: "timeout", code: nil)
            cb?(.timeout)
        }
    }

    /// 計測用: show() が押された時点の状態を記録する(在庫不足の切り分けに使う。
    /// ユーザーには見せない、Firebase への計測のみ)。
    private func logShowRequest(ready: Bool) {
        let ageSec = adLoadedAt.map { Int(Date().timeIntervalSince($0)) } ?? -1
        Analytics.logEvent("reward_ad_show_request", parameters: [
            "ready": ready ? 1 : 0,
            "ad_age_sec": ageSec,
            "sdk_state": LevelPlayAdsController.shared.stateDescription,
        ])
    }

    /// 計測用: どの段階で失敗したか(load / display / timeout)と SDK のエラーコードを記録する。
    private func logFailure(stage: String, code: Int?) {
        Analytics.logEvent("reward_ad_failure", parameters: [
            "stage": stage,
            "code": code ?? -1,
        ])
    }

    private func showDebugTestAd(completion: @escaping (RewardAdResult) -> Void) {
        guard let vc = UIApplication.shared.kwTopViewController else {
            completion(.unavailable)
            return
        }
        let alert = UIAlertController(
            title: "テスト広告",
            message: "デバッグ端末のため、テスト広告を表示しています…",
            preferredStyle: .alert)
        vc.present(alert, animated: true)
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            alert.dismiss(animated: true) { completion(.rewarded) }
        }
    }

    private func finish(_ result: RewardAdResult) {
        guard let callback = onResult else { return }
        onResult = nil
        callback(result)
    }

    // MARK: - LPMRewardedAdDelegate

    func didLoadAd(with adInfo: LPMAdInfo) {
        print("[RewardedAd] loaded")
        loadStartedAt = nil
        adLoadedAt = Date()
        consecutiveLoadFailures = 0
        // show() がロード完了前に呼ばれ、まだ待機中ならここで表示する。
        guard let cb = pendingCompletion,
              let ad = ad, ad.isAdReady(),
              let vc = UIApplication.shared.kwTopViewController else { return }
        pendingCompletion = nil
        pendingRequestID = nil
        pendingRequestDeadline = nil
        onResult = cb
        pendingRewardGranted = false
        ad.showAd(viewController: vc, placementName: nil)
    }

    private static let loadRetryDelays: [TimeInterval] = [5, 15, 30]

    func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {
        print("[RewardedAd] load failed: \(error)")
        loadStartedAt = nil
        let code = (error as NSError).code
        logFailure(stage: "load", code: code)
        if let cb = pendingCompletion {
            // show() 待機中だった。15秒の猶予がまだ3秒より多く残っていれば、呼び出し元には
            // 知らせずに少し置いて読み込み直す(以前は一度の失敗ですぐ「読み込めませんでした」
            // になっていた)。残りが少なければ素直に「表示不能」を通知する。
            let remaining = pendingRequestDeadline?.timeIntervalSinceNow ?? 0
            if remaining > 3 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in self?.preload() }
            } else {
                pendingCompletion = nil
                pendingRequestID = nil
                pendingRequestDeadline = nil
                cb(.classify(code: code))
            }
        }
        consecutiveLoadFailures += 1
        if consecutiveLoadFailures >= 3 {
            // リワード広告単体のリロードを何度試みても駄目なら、個別のロード問題ではなく
            // SDK セッション側を疑う。次に成功すれば didLoadAd でリセットされる。
            LevelPlayAdsController.shared.forceReinitialize(reason: "rewarded_repeated_failure")
        }
        // show() 待機中でなければ、次回のために少し置いて再プリロードする
        // (待機中は上の 1.5秒後の preload() だけで十分なので二重に走らせない)。
        if pendingCompletion == nil {
            let delay = Self.loadRetryDelays[min(consecutiveLoadFailures - 1, Self.loadRetryDelays.count - 1)]
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in self?.preloadIfNeeded() }
        }
    }

    func didDisplayAd(with adInfo: LPMAdInfo) {}

    func didRewardAd(with adInfo: LPMAdInfo, reward: LPMReward) {
        pendingRewardGranted = true
        finish(.rewarded)
    }

    func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {
        print("[RewardedAd] display failed: \(error)")
        loadStartedAt = nil
        adLoadedAt = nil
        logFailure(stage: "display", code: (error as NSError).code)
        finish(.unavailable)
        // 表示失敗後は次回のために即リロードする。
        preload()
    }

    func didClickAd(with adInfo: LPMAdInfo) {}

    func didCloseAd(with adInfo: LPMAdInfo) {
        // didRewardAd を経ずに閉じられた場合(視聴を最後まで完了しなかった)は dismissed 扱い。
        // 回数を消費するのは didRewardAd 経由の成功時のみ(S1-6)。
        // ただし公式ドキュメント通り didRewardAd が didCloseAd より後に届くことがあるため、
        // ここで即座に .dismissed 確定させると、視聴自体は成功していたのに報酬を取り逃す
        // (finish は最初の呼び出しだけが有効なので、後から来た didRewardAd が無視される)。
        // pendingRewardGranted がまだ立っていなければ、少し待ってから確定する。
        if !pendingRewardGranted {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
                guard let self, !self.pendingRewardGranted else { return }
                self.finish(.dismissed)
            }
        }
        preload()
    }
}
