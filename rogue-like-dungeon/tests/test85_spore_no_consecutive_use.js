// 力の胞子は、続けて使えない。使った直後(効果が最大のターン数)は使えず、1ターン進んで残りが減ったら、また使える。
// 戦闘後のアイコン・袋の「使う」・戦闘中の袋のどれでも同じ。
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const spore = (id) => ({ id, kind: 'item', itemId: 'spore', name: '力の胞子', rarity: 'common', asset: 'spore' });
const mkRun = ({ atkUp = 0, battle = false, n = 3 } = {}) => {
  const run = {
    floor: 10, node: 0,
    player: { hp: 60, poison: 0, atkUp, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 1, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: Array.from({ length: n }, (_, i) => spore('s' + i)),
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
  if (battle) run.enemies = [{ id: 'e1', bookId: 'slime', name: 'スライム', asset: 'slime', hp: 99999, maxHp: 99999, atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }];
  else { run.rewardPhase = 'reward'; run.drops = []; }
  return run;
};
async function boot(run, skills = {}) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount(); await d.click('再開'); await d.flush();
  return d;
}
const tile = (d) => [...d.container.querySelectorAll('.kw-quick .kw-qtile')].find((b) => b.textContent.includes('力の胞子'));
const sporeCount = (d) => d.readJSON(RUN_SAVE_KEY).inv.filter((x) => x.itemId === 'spore').length;

async function main() {
  {
    // 戦闘後: 使うと、続けては使えない(連打しても1個だけ減る)
    const d = await boot(mkRun());
    check('before use: the spore tile is usable', tile(d) && !tile(d).disabled);
    await d.doubleClickRace(tile(d));
    await d.flush(300);
    check('two quick taps use only one spore (3 -> 2), the buff is at 3 turns', sporeCount(d) === 2 && d.readJSON(RUN_SAVE_KEY).player.atkUp === 3, [sporeCount(d), d.readJSON(RUN_SAVE_KEY).player.atkUp]);
    check('the tile is disabled while the buff is at its maximum', tile(d).disabled);
    await d.click(tile(d)).catch(() => {});
    await d.flush(200);
    check('tapping the disabled tile does nothing', sporeCount(d) === 2);
    // 袋の中: 「使う」も押せず、理由が出る
    await d.click('袋・装備'); await d.flush();
    const row = [...d.container.querySelectorAll('.kw-stack')].find((r) => r.textContent.includes('力の胞子'));
    const use = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('使う'));
    check('the bag row is disabled too, with the reason', use.disabled && row.textContent.includes('1ターン進むと、また使えます'), row.textContent);
  }
  {
    // 残りターンが減っていれば使える(2 < 3)
    const d = await boot(mkRun({ atkUp: 2 }));
    check('with 2 turns left (below the maximum) it can be used again', !tile(d).disabled);
    await d.click(tile(d)); await d.flush(300);
    check('and it refreshes to 3 turns', sporeCount(d) === 2 && d.readJSON(RUN_SAVE_KEY).player.atkUp === 3, d.readJSON(RUN_SAVE_KEY).player);
  }
  {
    // 胞子の余韻(最大4ターン): 最大(4)に達している間だけ使えない。3ターン残りなら使える
    const d3 = await boot(mkRun({ atkUp: 3 }), { sporeTurns: true });
    check('with the 4-turn skill, 3 left is below the maximum (usable)', !tile(d3).disabled);
    const d4 = await boot(mkRun({ atkUp: 4 }), { sporeTurns: true });
    check('with the 4-turn skill, 4 left is blocked', tile(d4).disabled);
  }
  {
    // 戦闘中: 使った直後は使えない。1ターン進んで最大のままでも、もう1ターン進むまでは使えない
    const d = await boot(mkRun({ battle: true }));
    const bagUse = async () => {
      await d.click('袋 ('); await d.flush();
      const row = [...d.container.querySelectorAll('.kw-stack')].find((r) => r.textContent.includes('力の胞子'));
      const btn = [...row.querySelectorAll('button')].find((b) => b.textContent.includes('使う'));
      return { row, btn };
    };
    let { btn } = await bagUse();
    check('in battle: usable at first', !btn.disabled);
    const turn0 = d.readJSON(RUN_SAVE_KEY).turn || 1;
    await d.click(btn);
    await d.flushUntil(() => (d.readJSON(RUN_SAVE_KEY).turn || 1) > turn0, { tries: 150 });
    await d.flush(100);
    const p1 = d.readJSON(RUN_SAVE_KEY).player.atkUp;
    check('using it costs the turn; after the enemy turn the buff shows 3 (maximum)', p1 === 3, p1);
    ({ btn } = await bagUse());
    check('...and it is still blocked (no use on consecutive turns)', btn.disabled);
    await d.click([...d.container.querySelectorAll('.kw-overlay button')].find((b) => b.querySelector('svg')) || '防御');
    await d.flush();
    await d.click('防御');
    await d.flushUntil(() => (d.readJSON(RUN_SAVE_KEY).turn || 1) > turn0 + 1, { tries: 150 });
    await d.flush(100);
    check('one more turn: the buff drops to 2', d.readJSON(RUN_SAVE_KEY).player.atkUp === 2, d.readJSON(RUN_SAVE_KEY).player.atkUp);
    ({ btn } = await bagUse());
    check('now it can be used again', !btn.disabled);
  }
  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
