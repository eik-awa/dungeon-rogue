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
| `test4_discard_dead_run_safety_net.js` | 死亡直後の継承選択を経ずに「放棄する/新しく始める」を選んでも、推薦アイテムが自動継承される(stale closure 回帰チェック含む) |
| `test5_boss_reward_taskkill.js` | ボス撃破直後、確定ドロップを拾う前にタスキルされても報酬画面が復元される |
| `test6_duplication_race.js` | 死亡放棄の確定ボタンを連打しても継承品が二重に増えない |
| `test7_warp_anti_exploit.js` | 同じ章への再ワープは無効化される/ワープ直後はレア出現間隔がリセットされる(章の行き来によるレア連発の抜け道対策) |

## できないこと(限界)

- 実機・実シミュレータでのタップ操作テストではない(jsdom上のヘッドレスReact)。
  Safari実機エンジンと完全に同一の挙動を保証するものではない。
- `lucide-react` はアイコン名の網羅目的で `setup.js` 内でスタブ化している(実際のアイコン描画は検証しない)。
- 広告SDK・Firebase・BGM等のネイティブブリッジは全て no-op(`window.webkit` 未定義)。これらの検証は `/debug` を使う。
- 新しいシナリオを見つけたら `test8_*.js` のように追加していく(`run-all.js` が `test*.js` を自動で拾う)。
