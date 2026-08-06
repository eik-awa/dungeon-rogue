//
//  ContentView.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/07/08.
//

import SwiftUI

struct ContentView: View {
    private let adUnitID = "ca-app-pub-1615601076718034/7651406644"
    @State private var gameReady = false
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                GameWebView(onReady: { gameReady = true })
                AdBannerView(adUnitID: adUnitID)
                    .frame(height: 50)
            }
            .background(Color(red: 0x0a / 255, green: 0x12 / 255, blue: 0x0e / 255))
            .ignoresSafeArea(.container, edges: .top)

            if !gameReady {
                SplashView()
                    .transition(.opacity)
                    .ignoresSafeArea()
            }

            // アプリスイッチャーのスクリーンショットにゲーム画面を映さない
            if scenePhase != .active {
                Color(red: 10 / 255, green: 18 / 255, blue: 14 / 255)
                    .ignoresSafeArea()
            }
        }
        .animation(.easeOut(duration: 0.6), value: gameReady)
        .onAppear {
            UIApplication.shared.isIdleTimerDisabled = true
        }
        .task {
            try? await Task.sleep(nanoseconds: 10_000_000_000)
            gameReady = true
        }
    }
}

// MARK: - Splash Screen

struct SplashView: View {
    var body: some View {
        ZStack {
            Color(red: 10 / 255, green: 18 / 255, blue: 14 / 255)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                if let image = Bundle.main.appIcon {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 110, height: 110)
                        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                        .shadow(color: .black.opacity(0.6), radius: 24)
                } else {
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(Color(red: 0.08, green: 0.14, blue: 0.11))
                        .frame(width: 110, height: 110)
                }

                VStack(spacing: 4) {
                    Text("now loading...")
                        .font(.system(size: 13, weight: .light, design: .monospaced))
                        .foregroundColor(Color(red: 0.62, green: 0.71, blue: 0.65).opacity(0.6))
                        .kerning(3)
                }

                ProgressView()
                    .tint(Color(red: 0.4, green: 0.76, blue: 0.56))
                    .scaleEffect(1.3)
            }
        }
    }
}

// MARK: - Bundle Extension

private extension Bundle {
    /// アプリアイコンを取得する。appiconset は UIImage(named:) で直接取れないケースがあるため
    /// Info.plist の CFBundleIcons も辿って複数の方法でフォールバックする。
    var appIcon: UIImage? {
        // iOS 15+ では appiconset も UIImage(named:) で取得できる
        if let img = UIImage(named: "AppIcon") { return img }

        guard let icons = infoDictionary?["CFBundleIcons"] as? [String: Any],
              let primary = icons["CFBundlePrimaryIcon"] as? [String: Any] else { return nil }

        // Asset Catalog 方式: CFBundleIconName でアセット名を引く
        if let name = primary["CFBundleIconName"] as? String,
           let img = UIImage(named: name) { return img }

        // 旧来方式: CFBundleIconFiles のファイル名リスト
        if let files = primary["CFBundleIconFiles"] as? [String] {
            return files.reversed().compactMap { UIImage(named: $0) }.first
        }

        return nil
    }
}

#Preview {
    ContentView()
}
