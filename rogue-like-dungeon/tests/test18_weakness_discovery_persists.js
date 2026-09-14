// SAVE-03: discovering an enemy's weakness in battle must persist to meta.discovered and
// survive later meta writes (battleWon's slots/checkpoint updates use updateMeta, which no
// longer overwrites unrelated fields with a stale snapshot — see S-1).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkDaggerRunWithSlime() {
  return {
    floor: 1, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 30, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'slimeA', bookId: 'slime', name: '森スライム', asset: 'slime', hp: 1000, maxHp: 1000,
      atk: 1, def: 0, weak: ['斬', '魔'], resist: ['打'], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkDaggerRunWithSlime());
  await d.mount();
  await d.click('再開');
  await d.flush();
  console.log('[1] battle restored with the seeded slime:', d.text().includes('森スライム'));

  // Single alive enemy -> clicking the weapon card auto-targets and attacks immediately.
  await d.click(d.findButtonContaining('試験の短剣'));
  await d.flush(1000); // let attackWith's sleep()+afterPlayerAction()+enemyPhase() settle

  const meta = d.readJSON(SAVE_KEY);
  const w = meta.discovered?.slime?.w || [];
  console.log('[2] discovered weakness for slime:', JSON.stringify(w));
  const pass = w.includes('斬');
  console.log(pass ? 'PASS' : 'FAIL: weakness discovery not persisted');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
