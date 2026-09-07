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
            if phase == .active {
                if didRequestTracking {
                    // 2回目以降のフォアグラウンド復帰: 広告系の再試行トリガー(S1-2)。
                    // 「バックグラウンドで広告ブロックを OFF にして戻る」操作で復旧できるようにする。
                    // 未初期化なら即リトライ、初期化済みならリワード広告を再プリロードする
                    // (= initializeIfNeeded 内で preloadIfNeeded まで面倒を見る)。SDK 初期化前に
                    // preload を走らせないよう、ここでは preloadIfNeeded を直接呼ばない。
                    LevelPlayAdsController.shared.initializeIfNeeded()
                } else {
                    // アクティブ化の最初の一度だけ、同意 → トラッキング許可 → 広告 SDK 初期化を行う。
                    requestTrackingThenStartAds()
                }
            }
        }
    }

    /// GDPR/CCPA同意(InMobi Choice)・ATT許諾・広告SDK初期化を行う。
    /// 広告SDKの初期化は同意フローの完了を待たず、独立して即座に開始する(下記参照)。
    /// GDPR同意は LevelPlay SDK が自動的に読み取り、CCPA(米国州法)は
    /// ConsentManager 側のコールバックで setCCPA へ反映済みなので、ここでの追加対応は不要。
    private func requestTrackingThenStartAds() {
        guard !didRequestTracking else { return }
        didRequestTracking = true

        // 広告SDKの初期化は同意コールバックの中にネストしない。
        // initialize() が呼ばれる経路はプロセスあたり初回アクティブ化の1回だけなので、
        // ここで CMP(InMobi Choice)がハングすると──特に同意UI表示後は8秒タイムアウトが
        // 意図的にスキップされるため──そのセッションで広告が一切出なくなる。
        // LevelPlay SDK は UserDefaults の IAB TCF 文字列を自動読取りして GDPR 制限を
        // 適用するため、同意解決を待たずに初期化してもコンプライアンス上問題ない。
        LevelPlayAdsController.shared.initialize()

        ConsentManager.shared.requestConsentIfNeeded { resolved in
            Task {
                // 初回起動直後は UI がまだ完全にアクティブでないことがあるため、
                // わずかに待ってからダイアログを提示して確実に表示させる。
                try? await Task.sleep(nanoseconds: 500_000_000)
                await ATTrackingManager.requestTrackingAuthorization()

                // resolved=false はオフライン等で CMP が応答できずタイムアウト/エラーになった場合。
                // 計測はスキップする(広告 SDK は上で初期化済み)。
                if resolved && ConsentManager.shared.canEnableAnalytics {
                    Analytics.setAnalyticsCollectionEnabled(true)
                } else if !resolved {
                    print("[Consent] resolution timed out (offline?) — keeping analytics collection disabled")
                } else {
                    print("[Consent] analytics purpose consent denied — keeping analytics collection disabled")
                }

                // 本アプリは子ども向けではない(13歳未満を対象としない)。
                LPMPrivacySettings.setCOPPA(false)

                // 上の initialize() が(ごく稀に)失敗していた場合の再試行。通常は何もしない。
                LevelPlayAdsController.shared.initializeIfNeeded()
            }
        }
    }
}
