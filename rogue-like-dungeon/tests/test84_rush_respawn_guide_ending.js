// ボスラッシュの追加要素と、周辺の見直し:
//   - 一定のターンごとに、倒した取り巻きが立ち上がる(ボスは立ち上がらない)。立ち上がるまでのターンを画面で知らせる。スキルで間隔が延びる
//   - 中断して再開しても、倒した取り巻きの立ち上がりは逃れられない
//   - 踏破者向けスキルは多数ある(通常の冒険では効かない)
//   - 百層踏破のエンディングで、ボスラッシュへ案内する
//   - 「遊び方」: タブを切り替えたら本文のスクロールは先頭に戻る。ボスラッシュの項は踏破した人だけ
//   - 見出しは「## 」(マークダウン風)で、「── 」は使わない
const fs = require('fs');
const path = require('path');
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUSH_KEY = 'kiriwatari-rush-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const enemy = (id, extra = {}) => ({
  id, bookId: 'slime', name: id, asset: 'slime', hp: 100, maxHp: 100, atk: 0, def: 0,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false, ...extra,
});
const bossOf = (id, extra = {}) => enemy(id, { boss: true, summoned: 99, summons: [], hp: 99999, maxHp: 99999, ...extra });
const escort = (id, extra = {}) => enemy(id, { respawn: true, ...extra });
const weapon = (id, type, atk) => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'common', atk, asset: type });
const meta = (extra = {}) => ({ slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, clears: 1, ...extra });
const rushRun = (idx, enemies, over = {}) => ({
  floor: idx * 10 + 10, node: 0, nodes: ['boss'],
  player: { hp: 9000, poison: 0, atkUp: 0, guard: false },
  weapons: [weapon('剣', 'dagger', 1000)],
  armor: { helm: null, armor: null, charm: null }, inv: [],
  cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn: 3, enemies,
  rush: { idx, atk: 0, dr: 0, hp: 0, choices: null, picked: false, taken: {}, wave: 1 }, rushPhase: 'battle',
  ...over,
});
async function bootRush(m, run) {
  const d = makeDriver();
  d.seed(SAVE_KEY, m); d.seed(RUSH_KEY, run);
  await d.mount(); await d.flush();
  await d.click('ボスラッシュ 再開'); await d.flush();
  return d;
}
const readRush = (d) => d.readJSON(RUSH_KEY);
async function strike(d, targetName) {
  const before = readRush(d).turn || 1;
  await d.click('試験の剣'); await d.flush();
  const card = [...d.container.querySelectorAll('.kw-enemy')].find((e) => e.textContent.includes(targetName));
  await d.click(card);
  await d.flushUntil(() => (readRush(d).turn || 1) > before, { tries: 120 });
  await d.flush(); await d.flush();
}

async function main() {
  Math.random = () => 0.5;

  // ---- 立ち上がり
  {
    const run = rushRun(3, [bossOf('B'), escort('A', { hp: 1 }), escort('C')]);
    const d = await bootRush(meta(), run);
    await strike(d, 'A'); // ターン3: 倒す(3 % 4 != 0 なので、まだ立ち上がらない)
    let r = readRush(d);
    check('turn 3: the fallen escort stays down', r.turn === 4 && r.enemies.find((e) => e.id === 'A').hp <= 0, r.enemies.map((e) => [e.id, e.hp]));
    check('the card tells when it rises ("このターンの終わりに")', d.text().includes('このターンの終わりに、倒した取り巻きが立ち上がる'));
    await strike(d, 'C'); // ターン4: 倒す → この敵ターンの終わりに、4 % 4 == 0 で立ち上がる
    r = readRush(d);
    const a = r.enemies.find((e) => e.id === 'A'), c = r.enemies.find((e) => e.id === 'C');
    check('turn 4: both fallen escorts rise at 60% HP (hp 60 of 100)', a.hp === 60 && c.hp === 60 && !a.counted, [a.hp, c.hp, a.counted]);
    check('the log says so, and the boss never rises', d.text().includes('倒した取り巻きが、傷ついたまま立ち上がった!(2体)') && r.enemies.find((e) => e.id === 'B').hp > 0);
    check('the countdown note is gone while nobody is down', !d.text().includes('立ち上がる'));
  }
  {
    // スキルで間隔が延びる(静寂の間: +1 → 5ターンごと)
    const run = rushRun(3, [bossOf('B'), escort('A', { hp: 1 }), escort('C')]);
    const d = await bootRush(meta({ skills: { rushRespawn1: true } }), run);
    await strike(d, 'A'); await strike(d, 'C'); // ターン3, 4 → 5 の倍数ではないので立ち上がらない
    const r = readRush(d);
    check('rushRespawn1 delays it by one turn (nothing rises after turn 4)', r.turn === 5 && r.enemies.filter((e) => e.respawn && e.hp <= 0).length === 2, r.enemies.map((e) => [e.id, e.hp]));
    check('...and the note counts down to the new interval', d.text().includes('このターンの終わりに、倒した取り巻きが立ち上がる'));
  }
  {
    // 中断して再開しても、倒した取り巻きは残り、立ち上がる
    const run = rushRun(3, [bossOf('B'), escort('A', { hp: 0, counted: true }), escort('C')], { turn: 4 });
    const d = await bootRush(meta(), run);
    check('after a resume the fallen escort card is still there (not dropped)', d.container.querySelectorAll('.kw-enemy.dead').length === 1 && d.container.querySelectorAll('.kw-enemy').length === 3);
    await strike(d, 'C');
    const a = readRush(d).enemies.find((e) => e.id === 'A');
    check('and it rises at the next interval', a.hp === 60, a.hp);
  }
  {
    // 通常の冒険には立ち上がりは無い(取り巻きでない敵・ボスラッシュ以外)
    const normal = { floor: 5, node: 0, player: { hp: 9000, poison: 0, atkUp: 0, guard: false }, weapons: [weapon('剣', 'dagger', 1000)],
      armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn: 3,
      enemies: [enemy('X', { hp: 1, respawn: true }), enemy('Y', { hp: 99999, maxHp: 99999 })] };
    const d = makeDriver();
    d.seed(SAVE_KEY, meta()); d.seed(RUN_SAVE_KEY, normal);
    await d.mount(); await d.flush();
    await d.click('再開'); await d.flush();
    await d.click('試験の剣'); await d.flush();
    await d.click([...d.container.querySelectorAll('.kw-enemy')].find((e) => e.textContent.includes('X')));
    await d.flushUntil(() => (d.readJSON(RUN_SAVE_KEY).turn || 1) > 3, { tries: 120 });
    await d.click('試験の剣'); await d.flush(); // 生き残りは1体だけなので、そのまま攻撃が出る
    await d.flushUntil(() => (d.readJSON(RUN_SAVE_KEY).turn || 1) > 4, { tries: 120 });
    const x = d.readJSON(RUN_SAVE_KEY).enemies.find((e) => e.id === 'X');
    check('a normal adventure has no rising enemies (even a flagged one stays down at turn 4)', x.hp <= 0 && !d.text().includes('立ち上がった'), x);
  }

  // ---- スキルの数(踏破者向け)
  {
    const src = fs.readFileSync(path.join(__dirname, '../rogue-like-dungeon/kiriwatari-no-mori.jsx'), 'utf8');
    const block = src.slice(src.indexOf('const SKILL_TREE = ['), src.indexOf('// スキルの解放条件'));
    const ids = [...block.matchAll(/id: "(rush[A-Za-z0-9_]+)"/g)].map((m) => m[1]);
    const rushWpn = src.includes('id: `rushWpn_${type}`') ? 8 : 0;
    check('there are many rush skills (30 or more)', ids.length + rushWpn >= 30, ids.length + rushWpn);
    const types = [...block.matchAll(/effect: \{ type: "(rush[A-Za-z]+)"/g)].map((m) => m[1]);
    check('every rush skill effect type starts with "rush" (it never works outside the rush)', types.length > 0 && types.every((t) => t.startsWith('rush')));
  }

  // ---- エンディングの案内
  {
    const finalBoss = bossOf('最終', { hp: 1, maxHp: 1, final: true });
    const run = { floor: 100, node: 9, nodes: ['battle', 'battle', 'battle', 'battle', 'battle', 'battle', 'battle', 'battle', 'battle', 'boss'],
      player: { hp: 9000, poison: 0, atkUp: 0, guard: false }, weapons: [weapon('剣', 'dagger', 1000)],
      armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies: [finalBoss] };
    const d = makeDriver();
    d.seed(SAVE_KEY, meta({ clears: 0, bestFloor: 99 })); d.seed(RUN_SAVE_KEY, run);
    await d.mount(); await d.flush();
    await d.click('再開'); await d.flush();
    await d.click('試験の剣'); await d.flush();
    await d.flushUntil(() => d.text().includes('霧 は 晴 れ た'), { tries: 150 });
    const invite = d.container.querySelector('.kw-rush-invite');
    check('the ending invites the player to the boss rush', !!invite && invite.textContent.includes('次は、ボスラッシュに挑んでみましょう。') && invite.textContent.includes('タイトル画面の「ボスラッシュ」'), invite && invite.textContent);
    check('the ending headings are "## ..." (no dashes)', d.text().includes('## 終章') && d.text().includes('## 旅の記録') && !d.text().includes('─ 終章 ─'));
    await d.click('森の入り口へ帰る'); await d.flush();
    check('and after the clear the title really has the boss rush button', d.text().includes('ボ ス ラ ッ シ ュ'));
  }

  // ---- 遊び方
  {
    const d0 = makeDriver();
    d0.seed(SAVE_KEY, meta({ clears: 0 }));
    await d0.mount(); await d0.flush();
    await d0.click('遊び方'); await d0.flush();
    const tabs0 = [...d0.container.querySelectorAll('.kw-sheet button')].map((b) => b.textContent);
    check('before the first clear the guide has no boss rush tab', !tabs0.some((t) => t.includes('ボスラッシュ')) && tabs0.some((t) => t.includes('⑤')), tabs0);

    const d = makeDriver();
    d.seed(SAVE_KEY, meta({ clears: 1 }));
    await d.mount(); await d.flush();
    await d.click('遊び方'); await d.flush();
    check('after the first clear the guide gets the boss rush tab', !!d.findButtonContaining('⑥ ボスラッシュ'));
    const scroller = [...d.container.querySelectorAll('.kw-sheet div')].find((el) => el.style.overflowY === 'auto');
    scroller.scrollTop = 240;
    await d.click('② 武器'); await d.flush();
    check('switching tabs puts the text back at the top', scroller.scrollTop === 0, scroller.scrollTop);
    scroller.scrollTop = 90;
    await d.click('⑥ ボスラッシュ'); await d.flush();
    check('...also for the boss rush tab', scroller.scrollTop === 0, scroller.scrollTop);
    check('the guide headings use "## "', d.text().includes('## ボスラッシュ') && !d.text().includes('── ボスラッシュ'));
  }

  // ---- 見出しの記号(ソース全体に「── 」の見出しが残っていない)
  {
    const src = fs.readFileSync(path.join(__dirname, '../rogue-like-dungeon/kiriwatari-no-mori.jsx'), 'utf8');
    const left = src.split('\n').filter((l) => /(>|`|\s)── [^─]*(<|`)/.test(l) && !/^\s*(\/\/|\/\*|\{\/\*)/.test(l) && !l.includes('──ボスラッシュ') && !l.includes('──最後'));
    check('no "── 見出し ──" headings are left in the screen text', left.length === 0, left.slice(0, 3));
  }

  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
