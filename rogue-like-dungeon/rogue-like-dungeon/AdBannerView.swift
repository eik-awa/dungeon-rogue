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
import IronSource

/// LevelPlay の App Key。IronSource/LevelPlay ダッシュボード → Apps → App Key の値を使用。
/// Unity Dashboard の Game ID とは別の値なので注意。
let levelPlayAppKey = "278b7dd0d"

/// LevelPlay SDK の初期化状態をアプリ全体で共有する。
/// バナー広告オブジェクトは初期化完了(onInitSuccess)後に生成する必要があるため、
/// AdBannerView はこの状態を監視してから広告を生成する。
final class LevelPlayAdsController: ObservableObject {
    static let shared = LevelPlayAdsController()

    @Published private(set) var isInitialized = false

    private init() {}

    /// ATT の応答後に一度だけ呼び出す。
    func initialize() {
        guard !isInitialized else { return }
        let request = LPMInitRequestBuilder(appKey: levelPlayAppKey).build()
        LevelPlay.initWith(request) { [weak self] _, error in
            if let error = error {
                print("[AdBanner] init failed: \(error)")
                return
            }
            print("[AdBanner] init success")
            DispatchQueue.main.async { self?.isInitialized = true }
        }
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

        func didLoadAd(with adInfo: LPMAdInfo) {
            print("[AdBanner] banner loaded: \(adInfo.adUnitId)")
        }
        func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {
            print("[AdBanner] banner load failed (\(adUnitId)): \(error)")
        }
        func didDisplayAd(with adInfo: LPMAdInfo) {
            print("[AdBanner] banner displayed")
        }
        func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {
            print("[AdBanner] banner display failed: \(error)")
        }
        func didClickAd(with adInfo: LPMAdInfo) {}
        func didLeaveApp(with adInfo: LPMAdInfo) {}
        func didExpandAd(with adInfo: LPMAdInfo) {}
        func didCollapseAd(with adInfo: LPMAdInfo) {}
    }
}

/// SDK 初期化完了後にバナーを表示する。
struct AdBannerView: View {
    let adUnitID: String
    @ObservedObject private var ads = LevelPlayAdsController.shared

    var body: some View {
        if ads.isInitialized {
            AdBannerUIView(adUnitID: adUnitID)
        }
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
