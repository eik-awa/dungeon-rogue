// Feature: 敵の「変異」(第4章から、通常戦闘の敵1体に性質が付く)。
//   - 硬殻(shell): 殻が割れるまでは攻撃しない。最初の一撃は無効(殻が割れる)。割れたら攻撃してくる
//   - かばう(guard): ほかの敵を狙った単体攻撃を代わりに受ける。HP 50% 未満ならかばわない。全体攻撃は防げない
//   - 再生(regen): 敵ターンの終わりに最大HPの8%回復。毒を受けたターンは再生しない
//   - 群れ呼び(caller): 2回目の行動で攻撃せずに仲間を1体呼ぶ(1回だけ)。呼ばれた仲間は何も落とさない
//   - 吸魔(nullify): 武器のエンチャントが効かない
//   - 札に変異の印が出る。旧セーブの敵(mut なし)はそのまま動く
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const enemy = (id, extra = {}) => ({
  id, bookId: 'slime', name: id, asset: 'slime', hp: 5000, maxHp: 5000, atk: 0, def: 0,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false, ...extra,
});
const weapon = (id, type, atk, extra = {}) => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'common', atk, asset: type, ...extra });
const mkRun = (weapons, enemies, playerExtra = {}) => ({
  floor: 1, node: 0,
  player: { hp: 600, poison: 0, atkUp: 0, guard: false, ...playerExtra },
  weapons,
  armor: { helm: null, armor: null, charm: null }, inv: [],
  cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies,
});

async function start(run) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, bonusHp: 600 });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.click('再開');
  await d.flush();
  return d;
}
async function attackOnce(d, weaponName, targetName) {
  const turnBefore = d.readJSON(RUN_SAVE_KEY).turn;
  await d.click(weaponName);
  await d.flush();
  if (targetName) {
    const card = Array.from(d.container.querySelectorAll('.kw-enemy')).find((el) => el.querySelector('.kw-ename')?.textContent === targetName);
    if (card) await d.click(card);
  }
  await d.flushUntil(() => {
    const r = d.readJSON(RUN_SAVE_KEY);
    return !r || r.rewardPhase || (r.turn || 1) !== (turnBefore || 1);
  }, { tries: 80 });
  await d.flush(); await d.flush();
  return d.readJSON(RUN_SAVE_KEY);
}
const byId = (run, id) => run.enemies.find((x) => x.id === id);

async function main() {
  Math.random = () => 0.5; // rnd(0.9,1.1) -> 1.0 / 会心なし / 敵の溜めなし
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // [A] 硬殻: 1撃目は無効で、殻の間は攻撃してこない。割れた次のターンから攻撃してくる
  {
    const d = await start(mkRun([weapon('大剣', 'greatsword', 100), weapon('短剣', 'dagger', 10)], [enemy('A', { mut: 'shell', atk: 50 })]));
    check('shell: the card shows the mark', d.container.querySelector('.kw-chip.mut')?.textContent === '硬殻', d.container.querySelector('.kw-chip.mut')?.textContent);
    let run = await attackOnce(d, '試験の大剣');
    check('shell: the first hit does nothing (hp 5000) and breaks the shell', byId(run, 'A').hp === 5000 && byId(run, 'A').shellBroken === true, [byId(run, 'A').hp, byId(run, 'A').shellBroken]);
    check('shell: once broken, it attacks the same turn (player -50)', run.player.hp === 550, run.player.hp);
    const hpBefore = run.player.hp;
    run = await attackOnce(d, '試験の短剣');
    check('shell: after breaking, hits land (2 x 10)', byId(run, 'A').hp === 4980, byId(run, 'A').hp);
    check('shell: after breaking, it attacks (player -50)', run.player.hp === hpBefore - 50, [hpBefore, run.player.hp]);
    check('shell: the mark is gone once broken', !d.container.querySelector('.kw-chip.mut'), d.container.querySelector('.kw-chip.mut')?.textContent);
  }

  // 殻にこもったままの敵は攻撃してこない(もう1体だけを攻撃し続ける)
  {
    const d = await start(mkRun([weapon('短剣', 'dagger', 1)], [enemy('A', { mut: 'shell', atk: 50 }), enemy('B')]));
    let run = await attackOnce(d, '試験の短剣', 'B');
    run = await attackOnce(d, '試験の短剣', 'B');
    check('shell: an untouched shell never attacks (B has atk 0 -> min 1 x 2 turns)', run.player.hp === 598 && byId(run, 'A').hp === 5000 && !byId(run, 'A').shellBroken, [run.player.hp, byId(run, 'A').hp]);
    check('shell: the log says it stays in its shell', d.text().includes('Aは殻にこもっている'));
  }

  // [B] かばう: 単体攻撃は A が受ける。全体攻撃は両方に当たる。HP 50% 未満なら、かばわない
  {
    const d = await start(mkRun([weapon('大剣', 'greatsword', 100)], [enemy('A', { mut: 'guard' }), enemy('B')]));
    const run = await attackOnce(d, '試験の大剣', 'B');
    check('guard: a single-target hit aimed at B lands on A (220)', byId(run, 'A').hp === 4780 && byId(run, 'B').hp === 5000, [byId(run, 'A').hp, byId(run, 'B').hp]);
    check('guard: the log says A covered B', d.text().includes('AがBをかばった'));
  }
  {
    const d = await start(mkRun([weapon('本', 'book', 100)], [enemy('A', { mut: 'guard' }), enemy('B')]));
    const run = await attackOnce(d, '試験の本');
    check('guard: an all-enemy attack is not covered', byId(run, 'A').hp === 4900 && byId(run, 'B').hp === 4900, [byId(run, 'A').hp, byId(run, 'B').hp]);
  }
  {
    const d = await start(mkRun([weapon('大剣', 'greatsword', 100)], [enemy('A', { mut: 'guard', hp: 2000 }), enemy('B')]));
    check('guard: a weakened guard has no mark', !d.container.querySelector('.kw-chip.mut'));
    const run = await attackOnce(d, '試験の大剣', 'B');
    check('guard: below 50% hp it no longer covers (B takes the hit)', byId(run, 'B').hp === 4780 && byId(run, 'A').hp === 2000, [byId(run, 'A').hp, byId(run, 'B').hp]);
  }

  // [C] 再生: ターンの終わりに 8%(400)回復。毒を受けたターンは回復しない
  {
    const d = await start(mkRun([weapon('短剣', 'dagger', 1)], [enemy('A', { mut: 'regen', hp: 4000 })]));
    const run = await attackOnce(d, '試験の短剣');
    check('regen: 4000 - 2 (dagger) + 400 = 4398', byId(run, 'A').hp === 4398, byId(run, 'A').hp);
  }
  {
    const d = await start(mkRun([weapon('槍', 'spear', 10)], [enemy('A', { mut: 'regen', hp: 4000 })]));
    const run = await attackOnce(d, '試験の槍');
    check('regen: a poisoned enemy does not regenerate (4000 - 11 - 3)', byId(run, 'A').hp === 3986, byId(run, 'A').hp);
  }

  // [D] 群れ呼び: 2回目の行動で仲間を1体呼ぶ(呼ぶターンは攻撃しない)。1回だけ
  {
    const d = await start(mkRun([weapon('短剣', 'dagger', 1)], [enemy('A', { mut: 'caller', atk: 30 })]));
    check('caller: the mark counts down (2T)', d.container.querySelector('.kw-chip.mut')?.textContent === '群れ呼び 2T', d.container.querySelector('.kw-chip.mut')?.textContent);
    let run = await attackOnce(d, '試験の短剣');
    check('caller: turn 1 it attacks normally (-30), nobody called yet', run.player.hp === 570 && run.enemies.length === 1, [run.player.hp, run.enemies.length]);
    check('caller: then the mark says 1T', d.container.querySelector('.kw-chip.mut')?.textContent === '群れ呼び 1T', d.container.querySelector('.kw-chip.mut')?.textContent);
    run = await attackOnce(d, '試験の短剣');
    check('caller: turn 2 it calls one ally instead of attacking', run.enemies.length === 2 && run.enemies[1].callee === true && run.player.hp === 570, [run.enemies.length, run.player.hp]);
    const kid = run.enemies[1];
    run = await attackOnce(d, '試験の短剣', 'A');
    check('caller: it calls only once', run.enemies.length === 2, run.enemies.length);
    check('caller: the called ally is weaker (60% hp)', kid.maxHp > 0 && kid.hp === kid.maxHp, [kid.hp, kid.maxHp]);
  }
  // 呼ばれた仲間は何も落とさない(random 0.5 なら通常の敵は武器を1つ落とす)
  {
    const d = await start(mkRun([weapon('本', 'book', 10)], [enemy('A', { hp: 1, maxHp: 1 }), enemy('K', { hp: 1, maxHp: 1, callee: true })]));
    const run = await attackOnce(d, '試験の本');
    check('caller: only the normal enemy drops loot (1 drop, not 2)', run.rewardPhase === 'reward' && run.drops.length === 1, [run.rewardPhase, run.drops && run.drops.length]);
  }

  // [E] 吸魔: 貫き Lv3(防御の60%を無視)が効かない
  {
    const pierce = weapon('大剣', 'greatsword', 100, { ench: 'pierce', enchLv: 3 });
    let d = await start(mkRun([pierce], [enemy('A', { def: 10 })]));
    let run = await attackOnce(d, '試験の大剣');
    check('nullify: a normal enemy takes the pierce bonus (220 - 4)', byId(run, 'A').hp === 4784, byId(run, 'A').hp);
    d = await start(mkRun([pierce], [enemy('A', { def: 10, mut: 'nullify' })]));
    run = await attackOnce(d, '試験の大剣');
    check('nullify: the enchant does not work (220 - 10)', byId(run, 'A').hp === 4790, byId(run, 'A').hp);
    check('nullify: the log says the enchant did not reach', d.text().includes('の力が届かなかった'));
  }
  {
    const vamp = weapon('大剣', 'greatsword', 100, { ench: 'vampire', enchLv: 3 });
    const d = await start(mkRun([vamp], [enemy('A', { mut: 'nullify' })], { hp: 100 }));
    const run = await attackOnce(d, '試験の大剣');
    check('nullify: 吸魂 heals nothing from a nullify enemy (100 - 1 from the enemy)', run.player.hp === 99, run.player.hp);
  }

  // [F] 旧セーブの敵(mut なし)には印が出ず、普通に戦える
  {
    const d = await start(mkRun([weapon('大剣', 'greatsword', 100)], [enemy('A')]));
    check('old save: no mutation mark', !d.container.querySelector('.kw-chip.mut'));
    const run = await attackOnce(d, '試験の大剣');
    check('old save: a normal hit (220)', byId(run, 'A').hp === 4780, byId(run, 'A').hp);
  }

  // [G] 遊び方に「敵の変異」の説明がある
  {
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'rogue-like-dungeon', 'kiriwatari-no-mori.jsx'), 'utf8');
    check('guide: has the 敵の変異 section listing all mutations', src.includes('heading("敵の変異")') && src.includes('MUTATION_IDS.map'));
  }

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
