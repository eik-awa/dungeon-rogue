// ITEM-12: when the bag is already full, a dropped item must NOT be silently discarded —
// takeDropPure() returns the ORIGINAL state (with `drops` untouched) plus `full: true` when
// `inv.length >= invCap`, rather than removing the item from `drops` before failing to add it
// to `inv`. This locks that in against a regression where someone "simplifies" the early
// return to reuse the already-drops-filtered `ns` (which would silently drop the item).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function fullInv() {
  // invCapOf() default is 14 with no bagCap skills.
  return Array.from({ length: 14 }, (_, i) => ({
    id: `filler${i}`, kind: 'item', itemId: 'berrySmall', name: '木の実', rarity: 'common', asset: 'berry',
  }));
}

function mkRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 20, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: fullInv(),
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'slimeA', bookId: 'slime', name: '森スライム', asset: 'slime', hp: 1, maxHp: 1,
      atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  // Force rollDrops() to take the consumable branch (roll < 0.38) so the drop is `kind:"item"`
  // and therefore actually gated by the inv-cap check (weapon/armor drops instead try to
  // auto-equip into an empty slot first, which isn't what ITEM-12 is testing).
  const origRandom = Math.random;
  Math.random = () => 0.1;
  try {
    await d.click(d.findButtonContaining('試験の短剣'));
    await d.flushUntil(() => d.text().includes('勝 利'), { tries: 60 });
  } finally {
    Math.random = origRandom;
  }
  console.log('[1] reward screen reached:', d.text().includes('勝 利'));

  const pickupBtn = d.findButtonContaining('拾う');
  console.log('[2] a pickup button exists for the drop:', !!pickupBtn);
  await d.click(pickupBtn);
  await d.flush();

  const fullMsgShown = d.text().includes('袋がいっぱいで拾えませんでした');
  const stillPickable = !!d.findButtonContaining('拾う');
  console.log('[3] "bag full" message shown:', fullMsgShown, '| drop still offered (not silently discarded):', stillPickable);

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[4] inv count unchanged at cap (14):', run.inv.length);

  const pass = fullMsgShown && stillPickable && run.inv.length === 14;
  console.log(pass ? 'PASS' : 'FAIL: drop was lost when the bag was full');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
