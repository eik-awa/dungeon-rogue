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

/// LevelPlay Dashboard で発行したリワード広告の Ad Unit ID。
let rewardedAdUnitID = "dmywhrj06urqpzsi"

/// リワード広告の視聴結果。JS 側 `__onRewardAdResult__` にそのまま rawValue で渡す。
/// - rewarded: 視聴完了。報酬付与・回数消費の対象。
/// - dismissed: 視聴途中で閉じた。報酬なし・回数消費なし。
/// - unavailable: 広告をロードできなかった(通信断・広告ブロック等)。
/// - timeout: ロード待ちが規定時間を超えた。
enum RewardAdResult: String {
    case rewarded
    case dismissed
    case unavailable
    case timeout
}

/// リワード広告のロード・表示・コールバックを一元管理する。
final class RewardedAdController: NSObject, LPMRewardedAdDelegate {
    static let shared = RewardedAdController()

    private var ad: LPMRewardedAd?
    private var onResult: ((RewardAdResult) -> Void)?
    /// show() がロード完了前に呼ばれた場合に保持する待機中コールバック。
    private var pendingCompletion: ((RewardAdResult) -> Void)?

    /// ロード開始時刻。`didLoadAd` / `didFailToLoadAd` / `didFailToDisplayAd` で nil に戻す。
    /// 45秒経過してもどちらのコールバックも返らない場合(広告ブロックによるパケット破棄など)は
    /// スタックとみなし、`isLoading` を false 扱いにして再ロードを許可する(原因B対策)。
    private var loadStartedAt: Date?
    private var isLoading: Bool {
        guard let t = loadStartedAt else { return false }
        if Date().timeIntervalSince(t) > 45 { return false }
        return true
    }

    /// show() リクエストごとに採番する連番。タイムアウトを「そのリクエスト」に紐づける(原因C対策)。
    private var requestSeq: UInt64 = 0
    private var pendingRequestID: UInt64?

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
    func preloadIfNeeded() {
        if let ad = ad, ad.isAdReady() { return }
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
        guard let vc = UIApplication.shared.kwRootViewController else {
            completion(.unavailable)
            return
        }
        if let ad = ad, ad.isAdReady() {
            onResult = completion
            pendingRequestID = nil
            ad.showAd(viewController: vc, placementName: nil)
            return
        }
        // 広告がロード中またはロード前 — リクエストIDを採番し、15秒待って表示を試みる。
        requestSeq += 1
        let myID = requestSeq
        pendingRequestID = myID
        pendingCompletion = completion
        preload()
        DispatchQueue.main.asyncAfter(deadline: .now() + 15) { [weak self] in
            guard let self, self.pendingRequestID == myID else { return }
            // 自分のリクエストがまだ待機中のときだけ打ち切る。
            self.pendingRequestID = nil
            let cb = self.pendingCompletion
            self.pendingCompletion = nil
            cb?(.timeout)
        }
    }

    private func showDebugTestAd(completion: @escaping (RewardAdResult) -> Void) {
        guard let vc = UIApplication.shared.kwRootViewController else {
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
        // show() がロード完了前に呼ばれ、まだ待機中ならここで表示する。
        guard let cb = pendingCompletion,
              let ad = ad, ad.isAdReady(),
              let vc = UIApplication.shared.kwRootViewController else { return }
        pendingCompletion = nil
        pendingRequestID = nil
        onResult = cb
        ad.showAd(viewController: vc, placementName: nil)
    }

    func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {
        print("[RewardedAd] load failed: \(error)")
        loadStartedAt = nil
        if let cb = pendingCompletion {
            // show() 待機中だった — 呼び出し元へ「表示不能」を通知する。
            pendingCompletion = nil
            pendingRequestID = nil
            cb(.unavailable)
        }
        // 次回のために少し置いて再プリロード(広告ブロック解除後に復旧できるよう)。
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in self?.preloadIfNeeded() }
    }

    func didDisplayAd(with adInfo: LPMAdInfo) {}

    func didRewardAd(with adInfo: LPMAdInfo, reward: LPMReward) {
        finish(.rewarded)
    }

    func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {
        print("[RewardedAd] display failed: \(error)")
        loadStartedAt = nil
        finish(.unavailable)
        // 表示失敗後は次回のために即リロードする。
        preload()
    }

    func didClickAd(with adInfo: LPMAdInfo) {}

    func didCloseAd(with adInfo: LPMAdInfo) {
        // didRewardAd を経ずに閉じられた場合(視聴を最後まで完了しなかった)は dismissed 扱い。
        // 回数を消費するのは didRewardAd 経由の成功時のみ(S1-6)。
        finish(.dismissed)
        preload()
    }
}
