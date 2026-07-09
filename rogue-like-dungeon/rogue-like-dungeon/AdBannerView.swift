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
struct AdBannerView: UIViewRepresentable {
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
