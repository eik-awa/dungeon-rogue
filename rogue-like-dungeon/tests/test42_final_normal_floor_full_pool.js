// PROG-07: on a chapter's LAST normal floor (floorInStage === 9, right before the boss),
// enemiesForEncounter() must draw from the chapter's FULL enemy pool (all 8 for chapter 1),
// not the smaller "3 + floor/2" pool used on earlier floors — otherwise the tail-end enemies
// (only reachable on fis>=9, since fis===10 is the boss-only floor) could never appear and
// could never be registered in the bestiary. Sample many fresh encounters at floor 9 and
// confirm every chapter-1 bookId eventually shows up.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const CHAPTER1_ENEMIES = ['slime', 'enchantedRabbit', 'raven', 'shroom', 'lostChild', 'beetle', 'wisp', 'treant'];

function mkRun() {
  // node:0 with no `enemies` -> resumeRun() calls enterNode(), which rolls a fresh encounter
  // via enemiesForEncounter(floor=9, ...).
  return {
    floor: 9, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

async function main() {
  const seen = new Set();
  const SAMPLES = 60;
  for (let i = 0; i < SAMPLES; i++) {
    const d = makeDriver();
    d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
    d.seed(RUN_SAVE_KEY, mkRun());
    await d.mount();
    await d.click('再開');
    await d.flush();
    const run = d.readJSON(RUN_SAVE_KEY);
    for (const e of run.enemies || []) if (e.bookId) seen.add(e.bookId);
    if (CHAPTER1_ENEMIES.every((id) => seen.has(id))) break; // early exit once fully covered
  }

  const missing = CHAPTER1_ENEMIES.filter((id) => !seen.has(id));
  console.log('[1] bookIds seen across', SAMPLES, 'samples at floor 9 (fis=9):', JSON.stringify([...seen].sort()));
  console.log('[2] missing from the full chapter-1 pool:', JSON.stringify(missing));

  const pass = missing.length === 0;
  console.log(pass ? 'PASS' : 'FAIL: final normal floor did not draw from the full enemy pool');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
