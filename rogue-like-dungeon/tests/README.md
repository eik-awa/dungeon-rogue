# kiriwatari-no-mori.jsx 回帰テスト

`../rogue-like-dungeon/kiriwatari-no-mori.jsx` を書き換えたら、変更前後で必ずこれを実行する。
`/exploit-audit` の仕上げ確認としても使う(スキル側からこのディレクトリで `npm test` を呼ぶ)。

## 実行方法

```bash
cd tests
npm install   # 初回のみ
npm test
```

**注意**: このディレクトリは意図的に `rogue-like-dungeon/rogue-like-dungeon/`(Xcode の File System
Synchronized Root Group がフォルダごと自動でアプリのビルド対象に取り込む場所)の**外**、一つ上の
階層に置いている。中に置くと `node_modules/` 内の複数パッケージが同名ファイル(`.eslintrc` 等)を
持つため "Multiple commands produce" ビルドエラーになる(実際に発生した)。移動・複製する際は
この階層関係を崩さないこと。

`npm test` は `pretest` で実際の `../rogue-like-dungeon/kiriwatari-no-mori.jsx` を Babel で CommonJS に変換し
(`transform.js` → `component.compiled.js`。生成物なのでコミットしない)、その**実物のコード**を
jsdom + React 18.3.1(本番の esm.sh バンドルと同じバージョン)上でレンダリングして、
`test*.js` の各シナリオを本物のボタンクリックで検証する。ロジックの再実装ではない。

## 何を検証しているか

| ファイル | シナリオ |
|---|---|
| `test1_locked_slots.js` | ロック中アイテムは継承枠の優先度を持つが、枠の上限自体は超えない |
| `test2_rebirth_stage_pick.js` | 死亡→転生画面でステージ(章)を選び直せる |
| `test3_warp_preserves_items.js` | 生存中に「章を選ぶ」で別章へ移動しても所持品・HPが消えない |
| `test5_boss_reward_taskkill.js` | ボス撃破直後、確定ドロップを拾う前にタスキルされても報酬画面が復元される |
| `test7_warp_anti_exploit.js` | 同じ章への再ワープは無効化される/ワープ直後はレア出現間隔がリセットされる(章の行き来によるレア連発の抜け道対策) |
| `test8_orb_choice_reward.js` | 宝樹の雫を使って「継承枠+1」「精の結晶+1」のどちらを選んでも、その報酬が実際に確定する |
| `test9_bag_actions_persist_alone.js` | 収納でロックを1件だけトグルしても、他の変更を伴わず単独できちんと保存される |
| `test10_compensation_gift.js` | 初回起動時の見舞い結晶配布は1回だけ・既に受け取り済みなら再表示も再付与もされない |
| `test11_item_use_race.js` | 異なる2つの消耗品(苔の心臓)をほぼ同時に使っても、片方の効果(永続HP+6)が黙って消えない |
| `test12_orb_choice_button_race.js` | 宝樹の雫の「継承枠+1」/「精の結晶+1」ボタンをほぼ同時に押しても、両方または0件ではなく必ずちょうど1件だけ適用される |
| `test13_inherited_resurrect.js` | S-1: ラン開始直後に enterNode の meta 書き込みが、直前に消費したはずの継承品を復活させない |
| `test14_dew_priority.js` | S-2: 宝樹の雫は継承候補として最優先(スコア10000)で自動選択される |
| `test16_pause_during_clear_keeps_reward.js` | S-3: 章クリア画面(未回収の確定ドロップあり)で「中断してタイトルへ」しても、報酬が消えず再開できる |
| `test17_no_silent_discard_buttons.js` | 中断中の冒険(生存/死亡どちらも)を無言で捨てられるボタン(「続ける」での上書き・「放棄」)は一切出ない。「章を選ぶ」は生存中のみ引き続き出る |
| `test18_weakness_discovery_persists.js` | SAVE-03: 戦闘中に発見した弱点(`discovered`)が、`battleWon` 等の後続の meta 書き込みで消えない |
| `test19_corrupt_save_backup.js` | SAVE-05: セーブが壊れていても無言で初期化するだけでなく、元の文字列を `.corrupt_backup` キーへ退避してからタイトル画面を表示する |
| `test20_warp_keeps_unclaimed_boss_reward.js` | ITEM-04: 章クリア画面(未回収の確定ドロップあり)から「章を選ぶ」で別章へワープしても、ドロップが `takeAllPure` 経由で袋・装備へ退避され消えない |
| `test21_armor_swap_hp_no_dupe.js` | ITEM-08: HP差のある防具を10往復交互に付け替えても、HPが増殖/減少せず開始時と一致する(`equipItem` の `hpDiff` 両方向反映) |
| `test22_no_skip_enemy_turn.js` | BTL-01: 攻撃の演出中(`busy`)は「タイトルへ」が無効化され、敵ターンの反撃を踏み倒せない |
| `test23_no_double_attack_race.js` | BTL-03: 同じ武器の連打・異なる2つの武器の同時押しのいずれでも、1ターンに複数回攻撃が成立しない |
| `test24_no_double_advance_race.js` | PROG-01/PROG-02: 「先へ進む →」の連打で `floor`/`node` が2つ進まない。保存された敵が画面表示と一致する |
| `test25_revive_once_per_run.js` | AD-01: 広告復活は1ランに1回だけ。2回目の死亡では再度オファーされない(`reviveUsed`/`meta.reviveUsedThisRun` の二重ガード) |
| `test26_dew_ad_reward_saved_before_pickup.js` | AD-02: 広告視聴による雫報酬が、拾う/進めるより前の時点で確実に保存される(実バグ発見・修正: ネイティブコールバックからの `committed` パターンが同期保証なしで保存をスキップしていた) |
| `test27_old_schema_run_load.js` | SAVE-06: `armor`/`weapons`/`inv`/`player` を欠く旧スキーマの中断ランを読んでもクラッシュしない(実バグ発見・修正: `resumeRun` が `armor` を無補完のまま渡し `Object.values(undefined)` で全体がクラッシュしていた) |
| `test28_skilltree_migration_no_double_refund.js` | SAVE-08: スキルツリー移行(廃止スキルの結晶還元)が2回目の起動で再発生しない |
| `test29_full_bag_keeps_drop.js` | ITEM-12: 袋が満杯のときドロップを拾おうとしても `drops` から消えず、「満杯」表示が出る |
| `test30_elemental_filters_no_leak.js` | BTL-04/BTL-05: 属性限定スキル(余韻の吸収・極意のダメージ増)が対応属性の武器以外に漏れない(A-1 の回帰確認、決定論的なダメージ計算で検証) |
| `test31_battle_start_heal_no_overheal.js` | BTL-06: 戦闘開始時回復スキルが `maxHp` を超えて回復させない |
| `test32_boss_summon_cap.js` | BTL-07: ボスの召喚後も場の生存敵が3体を超えない |
| `test33_rare_flee_no_dew_and_no_softlock.js` | BTL-08: レア(金枝の精)が最後の1体として時間切れで消えても雫を落とさず、かつ戦闘画面がソフトロックしない(実バグ発見・修正: `enemyPhase` が全滅/逃走判定を持っておらず reward 画面へ遷移できず操作不能になっていた) |
| `test34_moss_heart_once_per_chapter.js` | PROG-06: 苔の心臓は章ごとに1回しかドロップしない |
| `test35_reward_ad_daily_cap.js` | AD-03: リワード広告の1日3回上限が守られ、日付が変われば正しくリセットされる |
| `test36_event_reward_race.js` | AD-04: 祠の報酬選択(継承枠/精の結晶)を同時タップしても、必ずどちらか一方だけが適用される(実バグ発見・修正: `eventConvert` が `gRef.current` を即時同期しておらず両方通ってしまっていた) |
| `test37_event_clock_rollback_blocked.js` | AD-05: 端末時計を過去に巻き戻しても祠の再挑戦(`clockBack`)がブロックされる |
| `test38_bag_count_display_matches_data.js` | UI-02: 袋の残数表示(`n/cap`)が実データ(`inv.length`・スキル込みの `invCapOf`)と一致する |
| `test39_protected_item_cannot_be_discarded.js` | ITEM-14: 保護設定中の高価値アイテムは「捨てる」ボタンが無効化され、直接呼んでも袋から消えない |
| `test40_weaponless_auto_fallback.js` | BTL-11: 武器0・袋にも武器なしで戦闘に入っても、応急の短剣が自動生成され行動不能にならない |
| `test41_multi_enemy_turn_completes_fully.js` | BTL-12: 敵2体の複数ステップの敵ターンが busy ウォッチドッグ等で途中打ち切りされず最後まで完遂する |
| `test42_final_normal_floor_full_pool.js` | PROG-07: 章の最終通常フロア(`fis===9`)では、そのステージの全敵種が抽選対象になる |
| `test43_death_screen_slot_display_matches_cap.js` | UI-03: 死亡画面の継承枠表示(`選択 n/m`)が、`togglePick` が実際に強制する上限(`effSlots`)と一致する |

**廃止したテスト**: `test4_discard_dead_run_safety_net.js` / `test6_duplication_race.js` /
`test15_abandon_doubleclick_no_dupe.js` は「放棄する/新しく始める」ボタン自体を削除した
(2026-09-14、製品判断)ため、テスト対象の機能ごと存在しなくなり削除した。同等の「中断データは
無言で失われない」という不変条件は `test17` が引き継いで検証している。

## できないこと(限界)

- 実機・実シミュレータでのタップ操作テストではない(jsdom上のヘッドレスReact)。
  Safari実機エンジンと完全に同一の挙動を保証するものではない。
- `lucide-react` はアイコン名の網羅目的で `setup.js` 内でスタブ化している(実際のアイコン描画は検証しない)。
- 広告SDK・Firebase・BGM等のネイティブブリッジは全て no-op(`window.webkit` 未定義)。これらの検証は `/debug` を使う。
- 新しいシナリオを見つけたら `test8_*.js` のように追加していく(`run-all.js` が `test*.js` を自動で拾う)。
