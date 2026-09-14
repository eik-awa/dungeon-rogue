// ITEM-14: a protected item (locked, or high-value under `protectRareItems`) cannot be
// discarded — the "捨てる" button itself is disabled, AND discardItem() independently guards
// on isItemProtected() so even a raw click bypassing the disabled attribute is a no-op.
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 1, // non-battle (chest/spring) node so the bag's discard action is enabled
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [{ id: 'legendaryDrop', kind: 'weapon', type: 'greatsword', name: '伝説の大剣', rarity: 'legend', atk: 999, asset: 'greatsword' }],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, protectRareItems: true });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();

  const origRandom = Math.random;
  Math.random = () => 0.1; // force floorNodes' mid slot to "chest", matching test21's technique
  try {
    await d.click('再開');
    await d.flush();
  } finally {
    Math.random = origRandom;
  }

  await d.click('袋');
  await d.flush();
  console.log('[1] bag opened with the legendary item visible:', d.text().includes('伝説の大剣'));

  const discardBtn = d.findButtonContaining('捨てる');
  console.log('[2] "捨てる" button NOT offered (disabled) for the protected item:', !discardBtn);
  const protectedLabelShown = d.text().includes('保護中');
  console.log('[3] "保護中" label shown in place of an active button:', protectedLabelShown);

  // Even a raw click bypassing the disabled attribute must not remove the item, since
  // discardItem() itself independently guards on isItemProtected().
  const anyDiscardBtn = Array.from(d.container.querySelectorAll('button')).find((b) => b.textContent.includes('保護中'));
  if (anyDiscardBtn) {
    act(() => { anyDiscardBtn.dispatchEvent(new d.env.window.MouseEvent('click', { bubbles: true, cancelable: true })); });
  }
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const stillInInv = (run.inv || []).some((i) => i.id === 'legendaryDrop');
  console.log('[4] item still present in storage after attempting to discard it:', stillInInv);

  const pass = !discardBtn && protectedLabelShown && stillInInv;
  console.log(pass ? 'PASS' : 'FAIL: protected item could be discarded');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
