//
//  AdBannerView.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/07/08.
//
//  画面最下部に常時表示する AdMob バナー。
//

import SwiftUI
import GoogleMobileAds

/// AdMob バナー(320x50)を SwiftUI へ橋渡しする。
private struct AdBannerUIView: UIViewRepresentable {
    let adUnitID: String

    func makeUIView(context: Context) -> BannerView {
        let banner = BannerView(adSize: AdSizeBanner)
        banner.adUnitID = adUnitID
        banner.rootViewController = UIApplication.shared.kwRootViewController
        banner.load(Request())
        return banner
    }

    func updateUIView(_ uiView: BannerView, context: Context) {
        // ルート VC がまだ無かった場合に備えて、表示更新時に補う。
        if uiView.rootViewController == nil {
            uiView.rootViewController = UIApplication.shared.kwRootViewController
            uiView.load(Request())
        }
    }
}

/// デバッグ端末では広告を完全にスキップする。
struct AdBannerView: View {
    let adUnitID: String

    var body: some View {
        if !DebugDeviceConfig.isDebugDevice {
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
