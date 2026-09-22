// Two smaller fixes:
//   1. Unequipping while the bag is full used to be a silent no-op (confusing "unresponsive
//      tap"). It must now show a visible error inside the bag overlay.
//   2. 森火の実(bomb) damage was buffed and must now show a live damage preview in the bag.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkFullBagRun() {
  const filler = Array.from({ length: 14 }, (_, i) => ({
    id: `f${i}`, kind: 'item', itemId: 'antidote', name: '毒消し草', rarity: 'common', asset: 'antidote',
  }));
  return {
    floor: 25, node: 1, // non-battle node, invCapOf() with no skills is 14 -> already full
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 20, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: filler,
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

async function testFullBagUnequipShowsError() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, mkFullBagRun());
  await d.mount();
  const origRandom = Math.random;
  Math.random = () => 0.1; // force floorNodes' mid slot to "chest" (non-battle), like test39
  try { await d.click('再開'); await d.flush(); } finally { Math.random = origRandom; }
  await d.click('袋・装備');
  await d.flush();
  const equippedCard = Array.from(d.container.querySelectorAll('button.kw-cell')).find((b) => b.textContent.includes('試験の短剣'));
  await d.click(equippedCard);
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const stillEquipped = (run.weapons || []).some((w) => w && w.id === 'w1');
  const errorShown = d.text().includes('袋がいっぱいです');
  console.log('[1] weapon correctly stays equipped (bag has no room):', stillEquipped);
  console.log('[2] a visible error is shown instead of a silent no-op:', errorShown);
  return stillEquipped && errorShown;
}

async function testBombDamagePreview() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, {
    floor: 25, node: 1,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 20, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [{ id: 'bomb1', kind: 'item', itemId: 'bomb', name: '森火の実', rarity: 'common', asset: 'bomb' }],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  });
  await d.mount();
  const origRandom = Math.random;
  Math.random = () => 0.1; // force floorNodes' mid slot to "chest" (non-battle), like test39
  try { await d.click('再開'); await d.flush(); } finally { Math.random = origRandom; }
  await d.click('袋・装備');
  await d.flush();

  // floor 25 -> bombPowerAt(25) = 30 + 25*4 = 130 (buffed formula; old formula gave 20+25*2=70).
  const previewShown = d.text().includes('現在の威力: 敵全体に130');
  console.log('[3] bomb damage preview shows the buffed value (130 at floor 25, not the old 70):', previewShown);
  return previewShown;
}

async function main() {
  const a = await testFullBagUnequipShowsError();
  const b = await testBombDamagePreview();
  console.log(a ? 'PASS: full-bag unequip shows a visible error' : 'FAIL: full-bag unequip error');
  console.log(b ? 'PASS: bomb damage preview reflects the buffed formula' : 'FAIL: bomb damage preview');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
