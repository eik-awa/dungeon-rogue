// UX fix (user-reported): while the bag is full during battle, the quick-access
// "袋" button in the battle subbar used to switch to the red/danger border style
// (borderColor: var(--danger)) — it read as an error/warning flashing up during an
// otherwise normal item-use action. The capacity readout ("袋 (n/n) 満杯") stays,
// but the alarming red border is dropped for this in-battle button specifically.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  const filler = Array.from({ length: 13 }, (_, i) => ({
    id: `f${i}`, kind: 'item', itemId: 'antidote', name: '毒消し草', rarity: 'common', asset: 'antidote',
  }));
  const inv = [
    { id: 'heal1', kind: 'item', itemId: 'berrySmall', name: '癒しの実', rarity: 'common', asset: 'berrySmall' },
    ...filler,
  ]; // 14 items = invCapOf() with no skills (14) -> bag starts FULL
  return {
    floor: 10, node: 0,
    player: { hp: 40, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w1', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv,
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'e1', bookId: 'slime', name: 'スライム', asset: 'slime', hp: 40, maxHp: 40, atk: 3, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  const bagBtn = Array.from(d.container.querySelectorAll('.kw-subbar button')).find((b) => b.textContent.includes('袋'));
  const labelBeforeUse = bagBtn.textContent;
  const hasDangerBorderWhileFull = bagBtn.style.borderColor === 'var(--danger)';
  console.log('[1] bag button label while full:', labelBeforeUse);
  console.log('[2] bag button still shows "満杯" while full:', labelBeforeUse.includes('満杯'));
  console.log('[3] bag button does NOT use the danger/red border while full:', !hasDangerBorderWhileFull);

  const pass = labelBeforeUse.includes('満杯') && !hasDangerBorderWhileFull;
  console.log(pass ? 'PASS' : 'FAIL: battle bag button still flashes a red danger border when full');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
