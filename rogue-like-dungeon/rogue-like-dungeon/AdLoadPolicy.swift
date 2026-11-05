//
//  AdLoadPolicy.swift
//  rogue-like-dungeon
//
//  リワード広告のロード失敗時の再試行の方針と、その判断ロジック。
//  SDK や UI に依存しない純粋なロジックだけをここに置き、`RewardedAdController` から使う
//  (tests/swift_policy で単体検証できるようにするため)。
//
//  背景: no-fill のたびに、上限なしで約30秒おきに再リクエストしていたため、no-fill の端末ほど
//  リクエストが増えていた。失敗するたびに間隔を広げ、上限(5分)で頭打ちにする。休止はしない
//  (在庫が戻ったときに、早く拾えるようにするため。一般的なメディエーションの実装と同じ考え方)。
//

import Foundation

/// 再試行・待機の定数。調整は必ずここで行う。
enum AdLoadPolicy {
    /// ロード失敗の n 回目の後に待つ秒数。最後の値が上限で、以降は同じ間隔(300秒)で続ける。
    static let retryDelays: [TimeInterval] = [10, 30, 60, 120, 300]
    /// 表示失敗(didFailToDisplayAd)の後に、次のロードまで待つ秒数。
    static let displayFailedRetryDelay: TimeInterval = 10
    /// ロード開始から応答がないままこの秒数が経ったらスタックとみなし、失敗として扱う。
    static let stuckTimeout: TimeInterval = 20
    /// 広告ボタン押下時にロード完了を待つ最大秒数。
    static let showWait: TimeInterval = 15
    /// 待機中のロードが no-fill 以外で失敗したとき、残りがこの秒数以上あれば1回だけ再試行する。
    static let showRetryMinRemaining: TimeInterval = 5

    /// no-fill を表す SDK のエラーコード(ISError.h: 509 = NO_ADS_TO_SHOW, 1058 = RV_LOAD_NO_FILL)。
    static func isNoFill(code: Int) -> Bool { code == 509 || code == 1058 }
}

/// 連続失敗の記録と、次の再試行までの間隔の決定。
struct AdLoadFailureTracker {
    private(set) var consecutiveFailures = 0

    /// 失敗を1件数える。
    mutating func record() {
        consecutiveFailures += 1
    }

    /// 次の再試行までの秒数(連続失敗の回数に応じて延び、上限で頭打ち)。
    func nextDelay() -> TimeInterval {
        let delays = AdLoadPolicy.retryDelays
        return delays[max(0, min(consecutiveFailures - 1, delays.count - 1))]
    }

    /// ロードに成功したときだけリセットする。
    mutating func reset() {
        consecutiveFailures = 0
    }
}
