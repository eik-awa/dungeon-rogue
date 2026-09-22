// Feature (user-requested): weapon slots can be reordered via drag & drop, entered through a
// "並び替え" toggle button. This is a pure display-order swap — it never touches HP, inventory,
// or the equipped items themselves, so it's safe outside the usual equip/unequip risk area.
//
// Drop-target detection deliberately does NOT use document.elementFromPoint: that approach
// hit-tests whatever is currently painted at the pointer's (x, y), but the dragged card itself
// is moved there via a CSS transform to follow the finger — so elementFromPoint kept reporting
// the dragged card itself instead of the card underneath it, and the swap silently never
// resolved on a real device (the bug this test now guards against). The fix instead tracks each
// slot's own DOM node via refs and does a direct geometric containment check against each
// slot's getBoundingClientRect() — independent of paint order/z-index/transforms.
//
// jsdom implements neither PointerEvent nor real layout (getBoundingClientRect always returns
// zeros), so this test dispatches MouseEvents typed as "pointerdown/move/up" — React's synthetic
// event system dispatches by the DOM event's `type` string, not by its constructor, so this
// reaches the same onPointerDown/Move/Up handlers a real touch drag would — and monkey-patches
// each slot's own getBoundingClientRect() to report a plausible on-screen rect, exactly like a
// real browser's layout engine would.
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 1, // non-battle node so the equip section is reachable
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [
      { id: 'w1', kind: 'weapon', type: 'dagger', name: '一番目の短剣', rarity: 'common', atk: 5, asset: 'dagger' },
      { id: 'w2', kind: 'weapon', type: 'axe', name: '二番目の斧', rarity: 'common', atk: 15, asset: 'axe' },
      { id: 'w3', kind: 'weapon', type: 'bow', name: '三番目の弓', rarity: 'common', atk: 20, asset: 'bow' },
    ],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

function fireAt(el, type, clientX, clientY, envWindow) {
  const ev = new envWindow.MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY });
  el.dispatchEvent(ev);
}

// Finds the drag-wrapper <div> for a given weapon name: the ItemCell button's own parent,
// matching the JSX shape `<div ref=...><ItemCell/>...</div>`.
function findSlotWrapper(container, weaponName) {
  const cell = Array.from(container.querySelectorAll('button.kw-cell')).find((b) => b.textContent.includes(weaponName));
  return cell ? cell.parentElement : null;
}

function mockRect(el, left, top, size = 100) {
  el.getBoundingClientRect = () => ({
    left, top, right: left + size, bottom: top + size, width: size, height: size, x: left, y: top,
  });
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  const origRandom = Math.random;
  Math.random = () => 0.1;
  try { await d.click('再開'); await d.flush(); } finally { Math.random = origRandom; }

  await d.click('袋・装備');
  await d.flush();

  await d.click(d.findButtonContaining('並び替え'));
  await d.flush();
  console.log('[1] reorder mode label switches:', d.text().includes('並び替え終了'));

  // In reorder mode, tapping an equipped card must NOT unequip it.
  const slot0Before = findSlotWrapper(d.container, '一番目の短剣');
  await act(async () => { slot0Before.querySelector('button').dispatchEvent(new d.env.window.MouseEvent('click', { bubbles: true, cancelable: true })); });
  await d.flush();
  const stillAllEquipped = d.readJSON(RUN_SAVE_KEY).weapons.every((w) => w);
  console.log('[2] tapping a card in reorder mode does not unequip it:', stillAllEquipped);

  // Drag slot 0 ("一番目の短剣") onto slot 2 ("三番目の弓"). Lay them out at plausible,
  // non-overlapping on-screen positions so the geometric hit-test has real rects to check.
  const slot0 = findSlotWrapper(d.container, '一番目の短剣');
  const slot1 = findSlotWrapper(d.container, '二番目の斧');
  const slot2 = findSlotWrapper(d.container, '三番目の弓');
  mockRect(slot0, 0, 0);
  mockRect(slot1, 110, 0);
  mockRect(slot2, 220, 0);

  await act(async () => { fireAt(slot0, 'pointerdown', 50, 50, d.env.window); });
  // In a real browser, the CSS transform on the dragged card follows the pointer, so its own
  // getBoundingClientRect() would ALSO now cover wherever the pointer currently is. Reproduce
  // that here to prove the dragged slot is excluded by index, not by accidentally-non-overlapping
  // mock geometry — without that exclusion this would make slot0 "hit itself" again (the exact
  // real-device bug being fixed) instead of correctly resolving to slot2 underneath.
  mockRect(slot0, 210, 0);
  // Move the pointer to well inside slot2's mocked rect (220-320, 0-100).
  await act(async () => { fireAt(slot0, 'pointermove', 260, 50, d.env.window); });
  await d.flush();
  const overHighlighted = slot2.style.boxShadow && slot2.style.boxShadow.includes('var(--hotaru)');
  console.log('[3] drop target gets highlighted while dragging over it:', !!overHighlighted);
  await act(async () => { fireAt(slot0, 'pointerup', 260, 50, d.env.window); });
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const swapped = run.weapons[0].id === 'w3' && run.weapons[2].id === 'w1' && run.weapons[1].id === 'w2';
  console.log('[4] slots 0 and 2 swapped, slot 1 untouched:', swapped, JSON.stringify(run.weapons.map((w) => w.id)));

  // Nothing about the items themselves (HP, inv, item identity) should have changed —
  // this is purely a display-order swap.
  const noSideEffects = run.player.hp === 60 && (run.inv || []).length === 0;
  console.log('[5] no side effects on HP/inventory (pure reorder):', noSideEffects);

  const pass = d.text().includes('並び替え終了') && stillAllEquipped && overHighlighted && swapped && noSideEffects;
  console.log(pass ? 'PASS' : 'FAIL: weapon drag reorder not working as intended');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
