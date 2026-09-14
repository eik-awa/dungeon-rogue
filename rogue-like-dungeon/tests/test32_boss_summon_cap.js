// BTL-07: a boss's summon action must never push the number of alive enemies past 3
// (`enemies.filter((x) => x.hp > 0).length < 3` gates enterPhase's summon branch). Seeding the
// boss already below the 55% HP summon threshold and taking a single no-damage turn ("防御")
// is enough to trigger exactly one summon without needing to orchestrate multi-turn damage.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 91, node: 0, // chapter 10 (final chapter), so makeBoss-equivalent seeded boss is plausible
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{
      id: 'bossFinal', bookId: 'bossFinal', name: '最終ボス', asset: 'bossFinal',
      hp: 500, maxHp: 1000, // 50% -> below the 55% first-summon threshold
      atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0,
      rare: false, boss: true, final: true, summoned: 0,
      summons: ['slime', 'wisp'], chargeLine: 'テスト用溜め', bigLine: 'テスト用大技', summonLine: 'テスト用召喚',
    }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 10, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  await d.click('防御');
  await d.flushUntil(() => (d.readJSON(RUN_SAVE_KEY).enemies || []).length !== 1, { tries: 60 });

  const run = d.readJSON(RUN_SAVE_KEY);
  const aliveCount = (run.enemies || []).filter((e) => e.hp > 0).length;
  console.log('[1] enemies after boss summons below 55% HP threshold:', run.enemies?.map((e) => e.name));
  console.log('[2] alive enemy count (expect exactly 3: boss + 2 summons, never more):', aliveCount);

  const pass = aliveCount === 3 && aliveCount <= 3;
  console.log(pass ? 'PASS' : 'FAIL: boss summon exceeded the 3-enemy cap or did not summon at all');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
