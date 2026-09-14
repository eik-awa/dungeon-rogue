// BTL-06: the battle-start heal skill (呼吸法+再生の心得, battleStartHealPct 18% combined)
// must not push HP above maxHp. enterNode() already wraps the heal in
// `Math.min(maxHpOf(s), s.player.hp + heal)` — this locks it in with a case picked to
// actually exceed the cap if that clamp were removed (70 + round(72*0.18)=13 = 83 > 72).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  // node:0 with no `enemies` -> resumeRun() calls enterNode() for node 0, which floorNodes()
  // always makes "battle" (no randomness needed to land here).
  return {
    floor: 1, node: 0,
    player: { hp: 70, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: { regenSeed: true, regen: true } });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[1] HP after battle-start heal (expect capped at 72, not 83):', run.player.hp);

  const pass = run.player.hp === 72;
  console.log(pass ? 'PASS' : 'FAIL: battle-start heal overhealed past maxHp');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
