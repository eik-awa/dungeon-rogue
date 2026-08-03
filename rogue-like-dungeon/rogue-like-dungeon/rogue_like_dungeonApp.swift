//
//  rogue_like_dungeonApp.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/07/08.
//

import SwiftUI
import GoogleMobileAds
import AppTrackingTransparency
import AVFoundation

@main
struct rogue_like_dungeonApp: App {
    @Environment(\.scenePhase) private var scenePhase

    init() {
        // カテゴリのみ設定する。setActive(true) は省略し、
        // 実際に音声再生するまで Apple Music を中断しない。
        try? AVAudioSession.sharedInstance().setCategory(
            .ambient, mode: .default, options: [.mixWithOthers])
    }
    // ATT の要求は一度だけ行う。
    @State private var didRequestTracking = false

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .onChange(of: scenePhase) { _, phase in
            // ATT ダイアログはアプリがアクティブになってからでないと表示されない。
            // アクティブ化の最初の一度だけ、トラッキング許可を要求する。
            if phase == .active {
                requestTrackingThenStartAds()
            }
        }
    }

    /// トラッキング許可ダイアログを提示し、応答後に AdMob を初期化する。
    /// 許可・拒否のいずれでも広告 SDK は起動する(拒否時は非パーソナライズ広告)。
    private func requestTrackingThenStartAds() {
        guard !didRequestTracking else { return }
        didRequestTracking = true

        Task {
            // 初回起動直後は UI がまだ完全にアクティブでないことがあるため、
            // わずかに待ってからダイアログを提示して確実に表示させる。
            try? await Task.sleep(nanoseconds: 500_000_000)
            await ATTrackingManager.requestTrackingAuthorization()
            await MobileAds.shared.start()
        }
    }
}
