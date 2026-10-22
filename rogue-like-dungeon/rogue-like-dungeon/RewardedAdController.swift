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
final class RewardedAdController: NSObject {
    static let shared = RewardedAdController()

    private var ad: LPMRewardedAd?
    /// 最新の広告オブジェクトの世代(preload のたびに +1)と、そのデリゲート(強参照で保持)。
    private var adGeneration: UInt64 = 0
    private var currentDelegate: RewardedAdDelegate?

    /// 広告を表示している最中かどうか。表示中は preload / 作り直し / 二重表示をすべて止める。
    /// 以前は、広告タップで App Store へ飛んで戻った等でアプリが非アクティブ→アクティブに戻ると
    /// preloadIfNeeded() が走り、表示中の広告(isAdReady() == false)の代わりに新しい広告が `ad` に
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
        reportKilledDuringShowIfNeeded()
        guard !isShowing else { return } // 表示中は広告オブジェクトを差し替えない
        guard !isLoading else { return }
        loadStartedAt = Date()
        adGeneration += 1
        let delegate = RewardedAdDelegate(owner: self, generation: adGeneration)
        let newAd = LPMRewardedAd(adUnitId: rewardedAdUnitID)
        newAd.setDelegate(delegate)
        currentDelegate = delegate
        ad = newAd
        newAd.loadAd()
    }

    /// 手持ちの広告が無ければ(または未ロードなら)再ロードする。
    /// フォアグラウンド復帰時などに呼び、広告ブロック解除後の復旧トリガーにする(S1-2)。
    /// 読み込みから30分以上たった広告は、isAdReady() が true のままでも古いとみなして作り直す。
    func preloadIfNeeded() {
        guard !isShowing else { return }
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
        guard !isShowing, onResult == nil, pendingCompletion == nil else { return }
        preloadIfNeeded()
    }

    /// SDK は初期化済みのまま、リワード広告のオブジェクトだけを作り直す。
    /// forceReinitialize から呼ばれる(SDK 自体の再初期化はもう行わない)。
    func rebuildAd() {
        guard !isShowing else { return }
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
        // 既に広告を表示している最中の二重表示は許さない(結果は先に始めた方へ返る)。
        if isShowing {
            completion(.unavailable)
            return
        }
        // 読み込み待ちのまま残っている前の依頼があれば、ここで打ち切る。残しておくと、新しい依頼の
        // 後で広告が読み込めた時点で、前の依頼の分として意図しない広告がもう1本表示されてしまう
        // (待機中コールバックが上書きされたり、二重に消化されたりする)。JS 側は文脈が合わない
        // 結果を無視するので、打ち切りの通知を返しても害はない。
        if let stale = pendingCompletion {
            pendingCompletion = nil
            pendingRequestID = nil
            pendingRequestDeadline = nil
            stale(.dismissed)
        }
        guard let vc = UIApplication.shared.kwTopViewController else {
            completion(.unavailable)
            return
        }
        if let ad = ad, ad.isAdReady(), !isStale {
            logShowRequest(ready: true)
            onResult = completion
            pendingRequestID = nil
            beginShowing(ad, from: vc)
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

    // MARK: - 表示中の管理

    /// 広告の表示を開始する。表示中は広告オブジェクトとデリゲートを強参照で保持し、
    /// preload / 作り直し / 二重表示を止める(閉じて結果を確定した時点で endShowing() で解除する)。
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
            self.preload()
        }
    }

    // MARK: - デリゲートからの通知(generation で古い広告オブジェクトの通知を捨てる)

    fileprivate func handleLoad(generation: UInt64) {
        // 差し替え済みの古い広告の読み込み完了は無視する(新しい広告の状態を触らせない)。
        guard generation == adGeneration, !isShowing else { return }
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
        beginShowing(ad, from: vc)
    }

    private static let loadRetryDelays: [TimeInterval] = [5, 15, 30]

    fileprivate func handleFailToLoad(generation: UInt64, error: Error) {
        // 差し替え済みの古い広告の読み込み失敗は無視する(新しい読み込みを失敗扱いにしない)。
        guard generation == adGeneration, !isShowing else { return }
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
        print("[RewardedAd] display failed: \(error)")
        loadStartedAt = nil
        adLoadedAt = nil
        logFailure(stage: "display", code: (error as NSError).code)
        finish(.unavailable)
        endShowing()
        // 表示失敗後は次回のために即リロードする。
        preload()
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
            preload()
            return
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            guard let self, self.isShowing, self.showingGeneration == generation else { return }
            if !self.pendingRewardGranted { self.finish(.dismissed) }
            self.endShowing()
            self.preload()
        }
    }
}
