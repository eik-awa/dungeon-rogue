// エンチャントの付く確率は、深い章ほど上がる(1章 1.0倍 → 1章ごとに +0.1倍、上限60%)。
//   伝説武器(章ボスの確定ドロップ)の確率: 1章 40% / 3章 48% / 6章以降 60%(上限)
//   Math.random を 0.5 に固定すると、1章・3章では付かず、6章・9章では付く。9章(上限なしなら72%)でも 0.65 では付かない(上限60%)
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

async function bossDropAt(floor, roll = 0.5) {
  Math.random = () => roll;
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: Math.ceil(floor / 10), bestFloor: floor, discovered: {}, mossHeartStages: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] });
  d.seed(RUN_SAVE_KEY, {
    floor, node: 0, player: { hp: 500, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 50, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'B', bookId: 'bossDeer', name: '森の主', asset: 'bossDeer', hp: 1, maxHp: 1000, atk: 0, def: 0,
      weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: true, summoned: 99, summons: [] }],
  });
  await d.mount();
  await d.click('再開'); await d.flush();
  await d.click(d.findButtonContaining('試験の短剣'));
  await d.flushUntil(() => d.text().includes('降りる') || d.text().includes('へ進む'), { tries: 200 });
  for (let k = 0; k < 40 && !(d.readJSON(RUN_SAVE_KEY)?.drops || []).some((x) => x.kind === 'weapon'); k++) await d.flush(50);
  const run = d.readJSON(RUN_SAVE_KEY);
  if (process.env.DBG) console.log(floor, JSON.stringify(run && run.drops), d.text().length);
  return ((run && run.drops) || []).find((x) => x.kind === 'weapon' && x.rarity === 'legend');
}

async function main() {
  Math.random = () => 0.5;
  const ch1 = await bossDropAt(10);
  const ch3 = await bossDropAt(30);
  const ch6 = await bossDropAt(60);
  const ch9 = await bossDropAt(90);
  const ch9cap = await bossDropAt(90, 0.65);
  check('the boss always drops a legend weapon', ch1 && ch3 && ch6 && ch9 && ch9cap, { ch1, ch3, ch6, ch9, ch9cap });
  check('chapter 1 (40%): no enchant at roll 0.5', ch1 && !ch1.ench, ch1);
  check('chapter 3 (48%): no enchant at roll 0.5', ch3 && !ch3.ench, ch3);
  check('chapter 6 (60%): enchant at roll 0.5', ch6 && !!ch6.ench && ch6.enchLv >= 1, ch6);
  check('chapter 9 (60%): enchant at roll 0.5', ch9 && !!ch9.ench, ch9);
  check('chapter 9 is capped at 60%: no enchant at roll 0.65', ch9cap && !ch9cap.ench, ch9cap);
  console.log(fails ? 'FAIL' : 'PASS');
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
