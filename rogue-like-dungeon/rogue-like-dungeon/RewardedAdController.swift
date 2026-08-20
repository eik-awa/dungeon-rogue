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
let rewardedAdUnitID = "abed0f4a-bc7e-4d90-aea0-3275196c6bea"

/// リワード広告のロード・表示・コールバックを一元管理する。
final class RewardedAdController: NSObject, LPMRewardedAdDelegate {
    static let shared = RewardedAdController()

    private var ad: LPMRewardedAd?
    private var onResult: ((Bool) -> Void)?

    private override init() {
        super.init()
    }

    /// LevelPlay SDK 初期化完了後に一度呼び、次に見せる広告を先読みしておく。
    func preload() {
        let ad = LPMRewardedAd(adUnitId: rewardedAdUnitID)
        ad.setDelegate(self)
        self.ad = ad
        ad.loadAd()
    }

    /// 広告を表示する。視聴完了(reward獲得)で true、それ以外(未ロード/失敗/離脱)で false をコールバックする。
    /// デバッグ端末(DebugDeviceConfig.isDebugDevice)では本番広告を消費せず、
    /// 数秒待って自動的に成功するだけの簡易テスト広告を表示する。
    func show(completion: @escaping (Bool) -> Void) {
        if DebugDeviceConfig.isDebugDevice {
            showDebugTestAd(completion: completion)
            return
        }
        guard let ad = ad, ad.isAdReady(), let vc = UIApplication.shared.kwRootViewController else {
            completion(false)
            return
        }
        onResult = completion
        ad.showAd(viewController: vc, placementName: nil)
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
    }

    func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {
        print("[RewardedAd] load failed: \(error)")
        // 少し待って次の視聴機会に備え再ロードする。
        DispatchQueue.main.asyncAfter(deadline: .now() + 30) { [weak self] in self?.preload() }
    }

    func didDisplayAd(with adInfo: LPMAdInfo) {}

    func didRewardAd(with adInfo: LPMAdInfo, reward: LPMReward) {
        finish(true)
    }

    func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {
        print("[RewardedAd] display failed: \(error)")
        finish(false)
    }

    func didClickAd(with adInfo: LPMAdInfo) {}

    func didCloseAd(with adInfo: LPMAdInfo) {
        // didRewardAd を経ずに閉じられた場合(視聴を最後まで完了しなかった)は失敗扱い。
        finish(false)
        preload()
    }
}
