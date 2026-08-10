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

/// LevelPlay の App Key。Unity Dashboard(Grow > LevelPlay > Apps)でアプリを登録して取得する。
/// TODO: 取得した実際の App Key に差し替えること。
let levelPlayAppKey = "YOUR_LEVELPLAY_APP_KEY"

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
        let requestBuilder = LPMInitRequestBuilder(appKey: levelPlayAppKey)
        LevelPlay.initWith(requestBuilder.build()) { [weak self] _, error in
            guard error == nil else { return }
            DispatchQueue.main.async {
                self?.isInitialized = true
            }
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

        func didLoadAd(with adInfo: LPMAdInfo) {}
        func didFailToLoadAd(withAdUnitId adUnitId: String, error: Error) {}
        func didClickAd(with adInfo: LPMAdInfo) {}
        func didDisplayAd(with adInfo: LPMAdInfo) {}
        func didFailToDisplayAd(with adInfo: LPMAdInfo, error: Error) {}
        func didLeaveApp(with adInfo: LPMAdInfo) {}
        func didExpandAd(with adInfo: LPMAdInfo) {}
        func didCollapseAd(with adInfo: LPMAdInfo) {}
    }
}

/// デバッグ端末、または SDK 未初期化時は広告を完全にスキップする。
struct AdBannerView: View {
    let adUnitID: String
    @ObservedObject private var ads = LevelPlayAdsController.shared

    var body: some View {
        if !DebugDeviceConfig.isDebugDevice && ads.isInitialized {
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
