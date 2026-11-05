// リワード広告の再試行方針(AdLoadPolicy.swift)の単体検証。SDK・UI に依存しない純粋なロジックだけを対象にする。
import Foundation

var failed = 0
func check(_ label: String, _ ok: Bool, _ detail: String = "") {
    print("\(ok ? "ok " : "NG ") \(label) \(detail)")
    if !ok { failed += 1 }
}

// 失敗が続くと間隔が延び、5分で頭打ちになる(休止はしない)
do {
    var t = AdLoadFailureTracker()
    var delays: [TimeInterval] = []
    for _ in 0..<8 { t.record(); delays.append(t.nextDelay()) }
    check("間隔は 10 → 30 → 60 → 120 → 300 秒と延び、以降は 300 秒のまま", delays == [10, 30, 60, 120, 300, 300, 300, 300], "\(delays)")
    check("上限(300秒)で止まり、いつまでも再試行は続く(休止しない)", t.nextDelay() == 300 && t.consecutiveFailures == 8)
    t.reset()
    check("ロード成功でリセットされると、また 10 秒から", t.consecutiveFailures == 0)
    t.record()
    check("リセット後の1回目の失敗は 10 秒", t.nextDelay() == 10)
}

// 1時間あたりの最大リクエスト数(上限 300 秒で続けた場合)は、以前の約120回より大幅に少ない
do {
    var t = AdLoadFailureTracker()
    var elapsed: TimeInterval = 0
    var requests = 1 // 最初のロード
    while true {
        t.record()
        elapsed += t.nextDelay()
        if elapsed > 3600 { break }
        requests += 1
    }
    check("失敗し続けた場合の1時間のロード要求は約16回(以前は約120回)", requests <= 20, "(\(requests))")
}

// no-fill の判定コード
check("509 / 1058 は no-fill", AdLoadPolicy.isNoFill(code: 509) && AdLoadPolicy.isNoFill(code: 1058))
check("520(通信なし)や 1001 は no-fill ではない", !AdLoadPolicy.isNoFill(code: 520) && !AdLoadPolicy.isNoFill(code: 1001))

// 定数
check("待機・スタック・表示失敗後の待ち時間が仕様どおり",
      AdLoadPolicy.showWait == 15 && AdLoadPolicy.stuckTimeout == 20
      && AdLoadPolicy.showRetryMinRemaining == 5 && AdLoadPolicy.displayFailedRetryDelay == 10)

print(failed == 0 ? "PASS" : "FAIL (\(failed))")
exit(failed == 0 ? 0 : 1)
