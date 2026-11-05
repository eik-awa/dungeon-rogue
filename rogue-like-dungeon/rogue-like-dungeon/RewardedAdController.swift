//
//  RewardedAdController.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/08/18.
//
//  リワード広告(Unity LevelPlay)。1日5回までの制限は JS 側(kiriwatari-no-mori.jsx)で管理し、
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

/// 広告オブジェクト1つにつき1つ作るデリゲート。`generation`(その広告を作った時点の世代)を持ち、
/// 差し替え済みの古い広告オブジェクトからのコールバックを `RewardedAdController` 側で見分けられるようにする。
/// (以前はコントローラー自身が全ての広告のデリゲートだったため、古い広告の読み込み完了/失敗が
/// 新しい広告の状態を上書きしたり、読み込み中の判定を狂わせたりしうる作りだった。)
private final class RewardedAdDelegate: NSObject, LPMRewardedAdDelegate {
    private weak var owner: RewardedAdController?
    let generation: UInt64

    init(owner: RewardedAdController, generation: UInt64) {
        self.owner = owner
        self.generation = generation
    }

    func didLoadAd(with adInfo: LPMAdInfo) { owner?.handleLoad(generation: generation) }
    func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) { owner?.handleFailToLoad(generation: generation, error: error) }
    func didDisplayAd(with adInfo: LPMAdInfo) { owner?.handleDisplay(generation: generation, adInfo: adInfo) }
    func didRewardAd(with adInfo: LPMAdInfo, reward: LPMReward) { owner?.handleReward(generation: generation) }
    func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) { owner?.handleFailToDisplay(generation: generation, error: error) }
    func didClickAd(with adInfo: LPMAdInfo) {}
    func didCloseAd(with adInfo: LPMAdInfo) { owner?.handleClose(generation: generation) }
}

/// リワード広告のロード・表示・コールバックを一元管理する。
///
/// ロードの状態: idle(未ロード)→ loading → ready / backoff(失敗後の再試行を予約中)。showing は表示中。
/// - ready の広告があるときは何もロードしない。用意できた広告を自分から捨てない
///   (期限切れの判定は SDK の isAdReady() に任せる)。
/// - ロードに失敗したら、間隔を広げて再試行する(AdLoadPolicy。上限は5分で、以降は同じ間隔)。
///   再試行の予約は常に1つだけ(DispatchWorkItem を保持して取り消す)。
/// - バナーの失敗とは連動させない(バナーの失敗でリワード広告を作り直さない)。
final class RewardedAdController: NSObject {
    static let shared = RewardedAdController()

    private var ad: LPMRewardedAd?
    /// 最新の広告オブジェクトの世代(ロード要求のたびに +1)と、そのデリゲート(強参照で保持)。
    private var adGeneration: UInt64 = 0
    private var currentDelegate: RewardedAdDelegate?

    /// 広告を表示している最中かどうか。表示中は ロード / 作り直し / 二重表示をすべて止める。
    /// 以前は、広告タップで App Store へ飛んで戻った等でアプリが非アクティブ→アクティブに戻ると
    /// ロードが走り、表示中の広告(isAdReady() == false)の代わりに新しい広告が `ad` に
    /// 入って表示中の広告への唯一の強参照が切れ、didCloseAd / didRewardAd が届かず、広告が閉じられない・
    /// 報酬が付かない・JS が「読み込み中…」のまま固まる、という症状になりえた。
    private var isShowing = false
    /// 表示中の広告とそのデリゲートの強参照(閉じて結果を確定するまで手放さない)。
    private var showingAd: LPMRewardedAd?
    private var showingDelegate: RewardedAdDelegate?
    private var showingGeneration: UInt64 = 0
    private var showStartedAt: Date?
    private var recoveryScheduled = false
    /// 「広告表示中にアプリが終了された」ことを次回起動時に検知するための印(UserDefaults)。
    private static let showingNetworkKey = "kw.rewardAd.showingNetwork"
    private var didReportKilledDuringShow = false
    private var onResult: ((RewardAdResult) -> Void)?
    /// show() がロード完了前に呼ばれた場合に保持する待機中コールバック。
    private var pendingCompletion: ((RewardAdResult) -> Void)?

    // MARK: ロードの管理

    /// ロード開始時刻。応答(成功/失敗)が届くか、スタックと判定された時点で nil に戻す。
    private var loadStartedAt: Date?
    private var isLoading: Bool {
        guard let t = loadStartedAt else { return false }
        return Date().timeIntervalSince(t) <= AdLoadPolicy.stuckTimeout
    }
    /// いま走っているロードを起こしたトリガー(計測用)。
    private var currentLoadTrigger = "init"
    private var stuckWork: DispatchWorkItem?

    /// 連続失敗の記録。ロード成功のときだけリセットする。
    private var failures = AdLoadFailureTracker()
    /// 再試行の予約(常に1つだけ)と、その予定時刻。バックグラウンド中は予約を取り消すが、
    /// 予定時刻は残し、復帰時に残り時間で予約し直す。
    private var retryWork: DispatchWorkItem?
    private var backoffDueAt: Date?

    /// 現在の `ad` が読み込み完了した時刻(計測用。広告の破棄の判断には使わない)。
    private var adLoadedAt: Date?

    /// show() リクエストごとに採番する連番。タイムアウトを「そのリクエスト」に紐づける(原因C対策)。
    private var requestSeq: UInt64 = 0
    private var pendingRequestID: UInt64?
    /// show() が待機を始めた際の15秒の期限。失敗時に「まだ何秒残っているか」の判定に使う。
    private var pendingRequestDeadline: Date?
    /// 待機中の show() のために、no-fill 以外の失敗後の再試行を1回使ったか。
    private var pendingRetried = false

    /// didRewardAd / didCloseAd は公式ドキュメントでも「順序は保証されない
    /// (didRewardAd が didCloseAd より後に届くことがある)」と明記されている。
    /// didCloseAd を先に受け取っても即座に .dismissed 扱いにはせず、このフラグで
    /// 「今回の視聴で既に didRewardAd が届いたか」を追跡する(表示のたびにリセット)。
    private var pendingRewardGranted = false

    private override init() {
        super.init()
        // バックグラウンド中は再試行しない。予約は取り消し、復帰時に残り時間で予約し直す。
        NotificationCenter.default.addObserver(
            self, selector: #selector(appDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification, object: nil)
    }

    @objc private func appDidEnterBackground() {
        cancelScheduledRetry(clearDue: false)
    }

    /// 計測用: 現在のロード状態の名前(reward_ad_show_request に添える)。
    var loadStateName: String {
        if isShowing { return "showing" }
        if let ad = ad, ad.isAdReady() { return "ready" }
        if isLoading { return "loading" }
        if backoffDueAt != nil { return "backoff" }
        return "idle"
    }

    // MARK: - ロード

    /// LevelPlay SDK 初期化完了後に一度呼び、次に見せる広告を先読みしておく。
    func preload() {
        requestLoad(trigger: "init")
    }

    /// フォアグラウンド復帰時に呼ぶ。
    /// - ready なら何もしない(広告を捨てない)。ロード中なら何もしない。
    /// - 再試行を予約中(backoff)なら、予約を立て直す(バックグラウンド中に取り消されているため)。
    /// - どれでもなければ(未ロード)、1回ロードする。
    /// 6時間以上のバックグラウンドからの復帰も同じ扱い(trigger だけ変える)。
    func preloadIfNeeded(trigger: String = "foreground") {
        guard !isShowing else { return }
        if let ad = ad, ad.isAdReady() { return }
        if isLoading { return }
        if let due = backoffDueAt {
            scheduleRetryWork(after: max(1, due.timeIntervalSinceNow))
            return
        }
        requestLoad(trigger: trigger)
    }

    /// ロードを1回始める。表示中なら何もしない。既に ready / ロード中なら何もしない。
    private func requestLoad(trigger: String) {
        reportKilledDuringShowIfNeeded()
        guard !isShowing else { return } // 表示中は広告オブジェクトを差し替えない
        if isLoading { return }
        if let ad = ad, ad.isAdReady() { return }
        cancelScheduledRetry(clearDue: true) // 予約済みの再試行は、このロードで置き換える
        loadStartedAt = Date()
        currentLoadTrigger = trigger
        adGeneration += 1
        let generation = adGeneration
        let delegate = RewardedAdDelegate(owner: self, generation: generation)
        let newAd = LPMRewardedAd(adUnitId: rewardedAdUnitID)
        newAd.setDelegate(delegate)
        currentDelegate = delegate
        ad = newAd
        let attempt = failures.consecutiveFailures
        Analytics.logEvent("reward_ad_load_request", parameters: ["trigger": trigger, "attempt": attempt])
        print("[RewardedAd] load request trigger=\(trigger) attempt=\(attempt)")
        scheduleStuckWatchdog(generation: generation)
        newAd.loadAd()
    }

    /// 応答がないままロードが20秒続いたらスタックとみなし、失敗として扱う(再試行を途切れさせないため)。
    private func scheduleStuckWatchdog(generation: UInt64) {
        stuckWork?.cancel()
        let work = DispatchWorkItem { [weak self] in self?.handleStuck(generation: generation) }
        stuckWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + AdLoadPolicy.stuckTimeout, execute: work)
    }

    private func handleStuck(generation: UInt64) {
        guard generation == adGeneration, loadStartedAt != nil, !isShowing else { return }
        let latency = loadStartedAt.map { Int(Date().timeIntervalSince($0) * 1000) } ?? -1
        loadStartedAt = nil
        logLoadResult("stuck", code: nil, latencyMs: latency)
        print("[RewardedAd] load stuck")
        failures.record()
        scheduleRetry(after: failures.nextDelay())
    }

    /// 再試行を予約する(常に1つ)。バックグラウンド中は予定時刻だけ記録し、復帰時に予約し直す。
    private func scheduleRetry(after delay: TimeInterval) {
        backoffDueAt = Date().addingTimeInterval(delay)
        scheduleRetryWork(after: delay)
    }

    private func scheduleRetryWork(after delay: TimeInterval) {
        retryWork?.cancel()
        retryWork = nil
        guard UIApplication.shared.applicationState == .active else { return }
        let work = DispatchWorkItem { [weak self] in
            self?.retryWork = nil
            self?.requestLoad(trigger: "retry")
        }
        retryWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: work)
    }

    private func cancelScheduledRetry(clearDue: Bool) {
        retryWork?.cancel()
        retryWork = nil
        if clearDue { backoffDueAt = nil }
    }

    private func logLoadResult(_ result: String, code: Int?, latencyMs: Int) {
        Analytics.logEvent("reward_ad_load_result", parameters: [
            "result": result,
            "code": code ?? -1,
            "latency_ms": latencyMs,
            "trigger": currentLoadTrigger,
        ])
    }

    // MARK: - 表示

    /// 広告を表示する。結果は `RewardAdResult` でコールバックする。
    /// ready なら即表示する。ready でなければ1回ロードし、最大15秒待ってから表示する
    /// (再試行の待ち時間中でも、ボタン押下ではすぐにロードする)。
    /// デバッグ端末(DebugDeviceConfig.isDebugDevice)では本番広告を消費せず、
    /// 数秒待って自動的に成功するだけの簡易テスト広告を表示する。
    func show(completion: @escaping (RewardAdResult) -> Void) {
        if DebugDeviceConfig.isDebugDevice {
            showDebugTestAd(completion: completion)
            return
        }
        // 既に広告を表示している最中の二重表示は許さない(結果は先に始めた方へ返る)。
        if isShowing {
            completion(.unavailable)
            return
        }
        // 読み込み待ちのまま残っている前の依頼があれば、ここで打ち切る。残しておくと、新しい依頼の
        // 後で広告が読み込めた時点で、前の依頼の分として意図しない広告がもう1本表示されてしまう
        // (待機中コールバックが上書きされたり、二重に消化されたりする)。JS 側は文脈が合わない
        // 結果を無視するので、打ち切りの通知を返しても害はない。
        completePending(.dismissed)
        guard let vc = UIApplication.shared.kwTopViewController else {
            completion(.unavailable)
            return
        }
        if let ad = ad, ad.isAdReady() {
            logShowRequest(ready: true)
            onResult = completion
            pendingRequestID = nil
            beginShowing(ad, from: vc)
            return
        }
        // ready でない — リクエストIDを採番し、15秒待って表示を試みる。
        logShowRequest(ready: false)
        requestSeq += 1
        let myID = requestSeq
        pendingRequestID = myID
        pendingCompletion = completion
        pendingRetried = false
        pendingRequestDeadline = Date().addingTimeInterval(AdLoadPolicy.showWait)
        requestLoad(trigger: "show") // ロード中なら、それを待つ
        DispatchQueue.main.asyncAfter(deadline: .now() + AdLoadPolicy.showWait) { [weak self] in
            guard let self, self.pendingRequestID == myID else { return }
            // 自分のリクエストがまだ待機中のときだけ打ち切る。
            print("[RewardedAd] show timed out")
            self.completePending(.timeout)
        }
    }

    private func completePending(_ result: RewardAdResult) {
        guard let cb = pendingCompletion else { return }
        pendingCompletion = nil
        pendingRequestID = nil
        pendingRequestDeadline = nil
        cb(result)
    }

    /// 計測用: show() が押された時点の状態を記録する(在庫不足の切り分けに使う。
    /// ユーザーには見せない、Firebase への計測のみ)。
    private func logShowRequest(ready: Bool) {
        let ageSec = adLoadedAt.map { Int(Date().timeIntervalSince($0)) } ?? -1
        Analytics.logEvent("reward_ad_show_request", parameters: [
            "ready": ready ? 1 : 0,
            "ad_age_sec": ageSec,
            "sdk_state": LevelPlayAdsController.shared.stateDescription,
            "load_state": loadStateName,
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

    // MARK: - 表示中の管理

    /// 広告の表示を開始する。表示中は広告オブジェクトとデリゲートを強参照で保持し、
    /// ロード / 作り直し / 二重表示を止める(閉じて結果を確定した時点で endShowing() で解除する)。
    private func beginShowing(_ ad: LPMRewardedAd, from vc: UIViewController) {
        isShowing = true
        showingAd = ad
        showingDelegate = currentDelegate
        showingGeneration = adGeneration
        showStartedAt = Date()
        pendingRewardGranted = false
        UserDefaults.standard.set("unknown", forKey: Self.showingNetworkKey)
        ad.showAd(viewController: vc, placementName: nil)
    }

    private func endShowing() {
        isShowing = false
        showingAd = nil
        showingDelegate = nil
        showStartedAt = nil
        UserDefaults.standard.removeObject(forKey: Self.showingNetworkKey)
    }

    /// 前回、広告表示中にアプリが終了されていたら、そのときのネットワーク名を Firebase に送る
    /// (閉じるボタンの無い壊れた広告素材などを出しているネットワークの特定に使う)。
    private func reportKilledDuringShowIfNeeded() {
        guard !didReportKilledDuringShow else { return }
        didReportKilledDuringShow = true
        let defaults = UserDefaults.standard
        guard let network = defaults.string(forKey: Self.showingNetworkKey) else { return }
        defaults.removeObject(forKey: Self.showingNetworkKey)
        Analytics.logEvent("reward_ad_killed_during_show", parameters: ["network": network])
    }

    /// フォアグラウンド復帰時に呼ぶ。「広告は既に閉じているのに、閉じた通知(didCloseAd)が届いていない」
    /// 状態で固まっていたら、結果を確定させて固まりを解消する。広告画面が前面に残っている間は
    /// 何もしない(広告を強制的に閉じることはしない)。
    func recoverIfShowingStuck() {
        guard isShowing, !recoveryScheduled else { return }
        recoveryScheduled = true
        let gen = showingGeneration
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) { [weak self] in
            guard let self else { return }
            self.recoveryScheduled = false
            guard self.isShowing, self.showingGeneration == gen else { return }
            // 表示を始めて間もない間(提示アニメーション中など)は判断しない。
            if let t = self.showStartedAt, Date().timeIntervalSince(t) < 4 { return }
            // 広告画面(ルート VC の上に提示されたもの)がまだ残っているなら、そのまま待つ。
            if UIApplication.shared.kwRootViewController?.presentedViewController != nil { return }
            Analytics.logEvent("reward_ad_stuck_recovered", parameters: ["rewarded": self.pendingRewardGranted ? 1 : 0])
            self.finish(self.pendingRewardGranted ? .rewarded : .dismissed)
            self.endShowing()
            self.requestLoad(trigger: "after_close")
        }
    }

    // MARK: - デリゲートからの通知(generation で古い広告オブジェクトの通知を捨てる)

    fileprivate func handleLoad(generation: UInt64) {
        // 差し替え済みの古い広告の読み込み完了は無視する(新しい広告の状態を触らせない)。
        guard generation == adGeneration, !isShowing else { return }
        let latency = loadStartedAt.map { Int(Date().timeIntervalSince($0) * 1000) } ?? -1
        print("[RewardedAd] loaded latency=\(latency)ms")
        loadStartedAt = nil
        stuckWork?.cancel()
        adLoadedAt = Date()
        failures.reset() // 失敗の記録は、ロード成功のときだけリセットする
        cancelScheduledRetry(clearDue: true)
        logLoadResult("loaded", code: nil, latencyMs: latency)
        // show() がロード完了前に呼ばれ、まだ待機中ならここで表示する。
        guard let cb = pendingCompletion,
              let ad = ad, ad.isAdReady(),
              let vc = UIApplication.shared.kwTopViewController else { return }
        pendingCompletion = nil
        pendingRequestID = nil
        pendingRequestDeadline = nil
        onResult = cb
        beginShowing(ad, from: vc)
    }

    fileprivate func handleFailToLoad(generation: UInt64, error: Error) {
        // 差し替え済みの古い広告の読み込み失敗は無視する(新しい読み込みを失敗扱いにしない)。
        guard generation == adGeneration, !isShowing else { return }
        let code = (error as NSError).code
        let latency = loadStartedAt.map { Int(Date().timeIntervalSince($0) * 1000) } ?? -1
        print("[RewardedAd] load failed code=\(code) latency=\(latency)ms: \(error)")
        loadStartedAt = nil
        stuckWork?.cancel()
        logLoadResult("failed", code: code, latencyMs: latency)
        failures.record()

        if pendingCompletion != nil {
            if AdLoadPolicy.isNoFill(code: code) {
                // 数秒内の再試行で取れることはまれなので、待たずに「在庫なし」を返す。
                completePending(.classify(code: code))
            } else {
                // no-fill 以外は、残りが5秒以上あるときだけ1回再試行する。それも失敗したら結果を返す。
                let remaining = pendingRequestDeadline?.timeIntervalSinceNow ?? 0
                if remaining >= AdLoadPolicy.showRetryMinRemaining && !pendingRetried {
                    pendingRetried = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                        guard let self else { return }
                        if self.pendingCompletion != nil {
                            self.requestLoad(trigger: "show_retry")
                        } else {
                            // 待機がもう終わっていたら、通常の再試行の予約に戻る。
                            self.scheduleRetry(after: self.failures.nextDelay())
                        }
                    }
                    return
                }
                completePending(.classify(code: code))
            }
        }
        scheduleRetry(after: failures.nextDelay())
    }

    fileprivate func handleDisplay(generation: UInt64, adInfo: LPMAdInfo) {
        guard isShowing, generation == showingGeneration else { return }
        // 表示できたネットワークを記録しておく(表示中に終了された場合の特定に使う)。
        UserDefaults.standard.set(adInfo.adNetwork ?? "unknown", forKey: Self.showingNetworkKey)
    }

    fileprivate func handleReward(generation: UInt64) {
        guard isShowing, generation == showingGeneration else { return }
        pendingRewardGranted = true
        finish(.rewarded)
    }

    fileprivate func handleFailToDisplay(generation: UInt64, error: Error) {
        guard isShowing, generation == showingGeneration else { return }
        let code = (error as NSError).code
        print("[RewardedAd] display failed code=\(code): \(error)")
        loadStartedAt = nil
        adLoadedAt = nil
        Analytics.logEvent("reward_ad_display_failed", parameters: ["code": code])
        finish(.unavailable)
        endShowing()
        // 表示失敗後は、10秒後にロードし直す(連続失敗にも数える)。
        failures.record()
        scheduleRetry(after: AdLoadPolicy.displayFailedRetryDelay)
    }

    fileprivate func handleClose(generation: UInt64) {
        guard isShowing, generation == showingGeneration else { return }
        // didRewardAd を経ずに閉じられた場合(視聴を最後まで完了しなかった)は dismissed 扱い。
        // 回数を消費するのは didRewardAd 経由の成功時のみ(S1-6)。
        // ただし公式ドキュメント通り didRewardAd が didCloseAd より後に届くことがあるため、
        // ここで即座に .dismissed 確定させると、視聴自体は成功していたのに報酬を取り逃す
        // (finish は最初の呼び出しだけが有効なので、後から来た didRewardAd が無視される)。
        // pendingRewardGranted がまだ立っていなければ、少し待ってから確定する。
        // 表示中の印(isShowing)と広告の強参照は、結果を確定させるまで手放さない。
        if pendingRewardGranted {
            endShowing()
            requestLoad(trigger: "after_close")
            return
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            guard let self, self.isShowing, self.showingGeneration == generation else { return }
            if !self.pendingRewardGranted { self.finish(.dismissed) }
            self.endShowing()
            self.requestLoad(trigger: "after_close")
        }
    }
}
