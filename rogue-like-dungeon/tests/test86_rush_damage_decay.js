// ボスラッシュ: 同じ敵ターンに何体にも殴られても、すぐ倒れない。
//   - 2体目以降の攻撃は少しずつ弱まる(n体目 = ×max(0.5, 1 - 0.12n))
//   - 1回の敵ターンで受けるダメージは、最大HPの60%まで(上限に達したあとに殴ってくる敵の攻撃は、1ダメージずつ)
//   - 通常の冒険には効かない
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUSH_KEY = 'kiriwatari-rush-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const enemy = (id, atk) => ({
  id, bookId: 'slime', name: id, asset: 'slime', hp: 90000, maxHp: 90000, atk, def: 0,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false,
});
const meta = (extra = {}) => ({ slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, everHadWeapon: true, clears: 1, bonusHp: 900, ...extra });
const weapon = { id: 'w', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 1, asset: 'dagger' };
const run = (foes, over = {}) => ({
  floor: 10, node: 0, nodes: ['boss'], player: { hp: 900, poison: 0, atkUp: 0, guard: false },
  weapons: [weapon], armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn: 2,
  enemies: foes, ...over,
});
const rushRun = (foes) => run(foes, { rush: { idx: 0, atk: 0, dr: 0, hp: 0, choices: null, picked: false, taken: {}, wave: 1 }, rushPhase: 'battle' });
const hpMax = (d) => { const m = d.container.querySelector('.kw-hud .kw-num')?.textContent.match(/(\d+)\s*\/\s*(\d+)/); return m ? { hp: +m[1], max: +m[2] } : null; };

async function lose(seedKey, save, foes) {
  const d = makeDriver();
  d.seed(SAVE_KEY, meta());
  d.seed(seedKey, save);
  await d.mount(); await d.flush();
  await d.click(seedKey === RUSH_KEY ? 'ボスラッシュ 再開' : '再開'); await d.flush();
  const before = hpMax(d);
  const turn0 = (d.readJSON(seedKey).turn || 1);
  await d.click('試験の短剣'); await d.flush();
  if (foes > 1) await d.click(d.container.querySelectorAll('.kw-enemy')[0]);
  await d.flushUntil(() => (d.readJSON(seedKey).turn || 1) > turn0, { tries: 160 });
  await d.flush();
  const after = hpMax(d);
  return { max: before.max, taken: before.hp - after.hp };
}

async function main() {
  Math.random = () => 0.5;
  {
    // 攻撃 100 の敵が3体: 100 + 88 + 76 = 264(上限の手前。減衰だけが効く)
    const r = await lose(RUSH_KEY, rushRun([enemy('a', 100), enemy('b', 100), enemy('c', 100)]), 3);
    check('rush: 3 attackers of 100 -> 100 + 88 + 76', r.taken === 264, r);
  }
  {
    // 6体目以降は半分で止まる: 100 + 88 + 76 + 64 + 52 + 50 = 430
    const r = await lose(RUSH_KEY, rushRun(['a', 'b', 'c', 'd', 'e', 'f'].map((i) => enemy(i, 100))), 6);
    check('rush: the decay stops at 50% (100 + 88 + 76 + 64 + 52 + 50)', r.taken === 430, r);
  }
  {
    // 一撃で最大HPを超える攻撃が5体: 1ターンで失うのは最大HPの60%まで(上限に達したあとの攻撃は1ずつ)
    const r = await lose(RUSH_KEY, rushRun(['a', 'b', 'c', 'd', 'e'].map((i) => enemy(i, 5000))), 5);
    check('rush: huge hits are capped at 60% of max HP in one enemy turn', r.taken === Math.round(r.max * 0.6) + 4 && r.taken < r.max * 0.62, r);
  }
  {
    // 通常の冒険では減衰も上限もない
    const r = await lose(RUN_SAVE_KEY, run([enemy('a', 100), enemy('b', 100), enemy('c', 100)]), 3);
    check('normal run: no decay (100 x 3 = 300)', r.taken === 300, r);
  }
  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
