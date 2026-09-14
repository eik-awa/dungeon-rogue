// ITEM-08: swapping between two armors with different HP bonuses repeatedly must not let HP
// drift upward (or downward) — equipItem() applies hpDiff = item.hp - old.hp in BOTH
// directions, so a full round trip nets to zero. Regression guard for the A-1-style fix
// already in equipItem(): "防具の HP ボーナス差分を両方向に反映する".
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const armorA = { id: 'armorA', kind: 'armor', type: 'armor', slot: 'armor', name: '軽装の鎧', rarity: 'common', hp: 5, asset: 'armor' };
const armorB = { id: 'armorB', kind: 'armor', type: 'armor', slot: 'armor', name: '重装の鎧', rarity: 'rare', hp: 25, asset: 'armor' };

function mkRun() {
  // node:1 with no `enemies` puts resumeRun() through enterNode() for the mid-slot node
  // (chest/spring, decided by Math.random — stubbed below to force "chest"), landing on a
  // non-battle phase where the bag's equip action is actually enabled (equipItem() is
  // disabled mid-battle in the bag UI).
  return {
    floor: 1, node: 1,
    player: { hp: 50, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: armorA, charm: null }, inv: [armorB],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  const origRandom = Math.random;
  Math.random = () => 0.1; // force floorNodes' mid slot to "chest" (non-battle phase)
  try {
    await d.click('再開');
    await d.flush();
  } finally {
    Math.random = origRandom;
  }
  console.log('[0] landed on non-battle phase:', !d.text().includes('防御'));

  await d.click('袋');
  await d.flush();
  console.log('[1] bag opened:', d.text().includes('装備する') || d.text().includes('軽装の鎧') || d.text().includes('重装の鎧'));

  for (let i = 0; i < 10; i++) {
    const btn = d.findButtonContaining('装備する');
    if (!btn) throw new Error(`swap ${i}: no equip button found`);
    await d.click(btn);
    await d.flush(50);
  }

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[2] final HP (expect 50, unchanged after 10 round-trip swaps):', run.player.hp);
  console.log('[3] equipped armor back to armorA (even number of swaps):', run.armor.armor?.id);

  const pass = run.player.hp === 50;
  console.log(pass ? 'PASS' : 'FAIL: HP drifted from repeated armor swaps');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
