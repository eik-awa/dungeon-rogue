//
//  rogue_like_dungeonApp.swift
//  rogue-like-dungeon
//
//  Created by eiki ogawa on 2026/07/08.
//

import SwiftUI
import AppTrackingTransparency
import AVFoundation
import FirebaseCore
import FirebaseAnalytics
import IronSource

@main
struct rogue_like_dungeonApp: App {
    @Environment(\.scenePhase) private var scenePhase

    init() {
        FirebaseApp.configure()
        // ATT の応答が済むまでは収集を止めておき、トラッキング許可ダイアログへの
        // 応答後(許可・拒否いずれの場合も)に有効化する(同意前収集を避けるため)。
        Analytics.setAnalyticsCollectionEnabled(false)
        // カテゴリのみ設定する。setActive(true) は省略し、
        // 実際に音声再生するまで Apple Music を中断しない。
        try? AVAudioSession.sharedInstance().setCategory(
            .ambient, mode: .default, options: [.mixWithOthers])
        print("[DebugBadge] Identifier: \(DebugDeviceConfig.persistentDeviceID)")
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

    /// GDPR/CCPA同意(InMobi Choice)→ ATT許諾 → 広告SDK初期化、の順で行う。
    /// GDPR同意は LevelPlay SDK が自動的に読み取り、CCPA(米国州法)は
    /// ConsentManager 側のコールバックで setCCPA へ反映済みなので、ここでの追加対応は不要。
    private func requestTrackingThenStartAds() {
        guard !didRequestTracking else { return }
        didRequestTracking = true

        ConsentManager.shared.requestConsentIfNeeded { resolved in
            Task {
                // 初回起動直後は UI がまだ完全にアクティブでないことがあるため、
                // わずかに待ってからダイアログを提示して確実に表示させる。
                try? await Task.sleep(nanoseconds: 500_000_000)
                await ATTrackingManager.requestTrackingAuthorization()

                // resolved=false はオフライン等で CMP が応答できずタイムアウトした場合。
                // 同意状況が未確定のまま計測・広告配信を有効化しないよう、このセッションでは
                // 両方とも見送る(didRequestTracking はプロセスの再起動ごとにリセットされるため、
                // 次回起動時にオンラインであれば自動的に再試行される)。
                guard resolved else {
                    print("[Consent] resolution timed out (offline?) — skipping analytics/ads this session")
                    return
                }

                // 応答が済んだので、以降のアプリ利用状況の計測を開始する。
                // ただし GDPR 対象ユーザーが計測目的(TCF Purpose 1)への同意を拒否した
                // 場合は、setAnalyticsCollectionEnabled を呼んでも Firebase 側は同意状態を
                // 自動で見てくれないため、ここで明示的にスキップする。
                if ConsentManager.shared.canEnableAnalytics {
                    Analytics.setAnalyticsCollectionEnabled(true)
                } else {
                    print("[Consent] analytics purpose consent denied — keeping analytics collection disabled")
                }

                // 本アプリは子ども向けではない(13歳未満を対象としない)。
                LPMPrivacySettings.setCOPPA(false)

                LevelPlayAdsController.shared.initialize()
            }
        }
    }
}
