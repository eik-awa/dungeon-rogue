//
//  ContentView.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/07/08.
//

import SwiftUI

struct ContentView: View {
    // AdMob バナー広告ユニット ID
    private let adUnitID = "ca-app-pub-1615601076718034/7651406644"

    var body: some View {
        VStack(spacing: 0) {
            GameWebView()
            // 常に最下部に配置する広告(セーフエリア内=ホームインジケータの上)
            AdBannerView(adUnitID: adUnitID)
                .frame(height: 50)
        }
        .background(Color(red: 0x0a / 255, green: 0x12 / 255, blue: 0x0e / 255))
        // 上部(Dynamic Island 側)まで背景を伸ばす。UI 自体は CSS の
        // env(safe-area-inset-top) で内側に余白を取るため見切れない。
        .ignoresSafeArea(.container, edges: .top)
    }
}

#Preview {
    ContentView()
}
