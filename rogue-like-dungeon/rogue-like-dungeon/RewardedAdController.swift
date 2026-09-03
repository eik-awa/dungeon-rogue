//
//  RewardedAdController.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/08/18.
//
//  リワード広告(Unity LevelPlay)。1日3回までの制限は JS 側(kiriwatari-no-mori.jsx)で管理し、
//  ネイティブ側は「表示できるかどうか」と「視聴完了したかどうか」だけを担当する。
//

import Foundation
import UIKit
import IronSource

/// LevelPlay Dashboard で発行したリワード広告の Ad Unit ID。
let rewardedAdUnitID = "dmywhrj06urqpzsi"

/// リワード広告のロード・表示・コールバックを一元管理する。
final class RewardedAdController: NSObject, LPMRewardedAdDelegate {
    static let shared = RewardedAdController()

    private var ad: LPMRewardedAd?
    private var onResult: ((Bool) -> Void)?
    /// show() がロード完了前に呼ばれた場合に保持する待機中コールバック。
    private var pendingCompletion: ((Bool) -> Void)?
    private var isLoading = false
    /// show() 呼び出し後にロード失敗した場合の自動リトライ回数。
    private var pendingRetryCount = 0
    private let maxPendingRetries = 2

    private override init() {
        super.init()
    }

    /// LevelPlay SDK 初期化完了後に一度呼び、次に見せる広告を先読みしておく。
    func preload() {
        guard !isLoading else { return }
        isLoading = true
        let newAd = LPMRewardedAd(adUnitId: rewardedAdUnitID)
        newAd.setDelegate(self)
        ad = newAd
        newAd.loadAd()
    }

    /// 広告を表示する。視聴完了(reward獲得)で true、それ以外(未ロード/失敗/離脱)で false をコールバックする。
    /// 広告がまだロード中の場合は最大10秒待ってから表示する。
    /// デバッグ端末(DebugDeviceConfig.isDebugDevice)では本番広告を消費せず、
    /// 数秒待って自動的に成功するだけの簡易テスト広告を表示する。
    func show(completion: @escaping (Bool) -> Void) {
        if DebugDeviceConfig.isDebugDevice {
            showDebugTestAd(completion: completion)
            return
        }
        guard let vc = UIApplication.shared.kwRootViewController else {
            completion(false)
            return
        }
        if let ad = ad, ad.isAdReady() {
            onResult = completion
            ad.showAd(viewController: vc, placementName: nil)
            return
        }
        // 広告がロード中またはロード前 — 自動リトライを含め最大30秒待って表示する。
        pendingCompletion = completion
        pendingRetryCount = 0
        preload()
        DispatchQueue.main.asyncAfter(deadline: .now() + 30) { [weak self] in
            guard let self, let cb = self.pendingCompletion else { return }
            self.pendingCompletion = nil
            self.pendingRetryCount = 0
            cb(false)
        }
    }

    private func showDebugTestAd(completion: @escaping (Bool) -> Void) {
        guard let vc = UIApplication.shared.kwRootViewController else {
            completion(false)
            return
        }
        let alert = UIAlertController(
            title: "テスト広告",
            message: "デバッグ端末のため、テスト広告を表示しています…",
            preferredStyle: .alert)
        vc.present(alert, animated: true)
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            alert.dismiss(animated: true) { completion(true) }
        }
    }

    private func finish(_ success: Bool) {
        guard let callback = onResult else { return }
        onResult = nil
        callback(success)
    }

    // MARK: - LPMRewardedAdDelegate

    func didLoadAd(with adInfo: LPMAdInfo) {
        print("[RewardedAd] loaded")
        isLoading = false
        // show() がロード完了前に呼ばれていた場合はここで即表示する。
        if let cb = pendingCompletion,
           let ad = ad, ad.isAdReady(),
           let vc = UIApplication.shared.kwRootViewController {
            pendingCompletion = nil
            onResult = cb
            ad.showAd(viewController: vc, placementName: nil)
        }
    }

    func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {
        print("[RewardedAd] load failed (retry \(pendingRetryCount)/\(maxPendingRetries)): \(error)")
        isLoading = false
        if pendingCompletion != nil, pendingRetryCount < maxPendingRetries {
            // show() 待機中のリトライが残っている — ユーザーへの通知なしに即リトライ
            pendingRetryCount += 1
            preload()
        } else {
            // リトライ上限到達 or バックグラウンドプリロード失敗 — 呼び出し元へ通知して次回向けに再プリロード
            pendingRetryCount = 0
            if let cb = pendingCompletion {
                pendingCompletion = nil
                cb(false)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in self?.preload() }
        }
    }

    func didDisplayAd(with adInfo: LPMAdInfo) {}

    func didRewardAd(with adInfo: LPMAdInfo, reward: LPMReward) {
        finish(true)
    }

    func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {
        print("[RewardedAd] display failed: \(error)")
        finish(false)
        // 表示失敗後は次回のために即リロードする。
        preload()
    }

    func didClickAd(with adInfo: LPMAdInfo) {}

    func didCloseAd(with adInfo: LPMAdInfo) {
        // didRewardAd を経ずに閉じられた場合(視聴を最後まで完了しなかった)は失敗扱い。
        finish(false)
        preload()
    }
}
