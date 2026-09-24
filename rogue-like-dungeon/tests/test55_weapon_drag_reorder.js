// Feature (user-requested): weapon slots are reordered in a weapons-only popup by tapping two
// slots in turn (swap). The earlier drag & drop conflicted with vertical scrolling of the bag.
// Pure display-order swap: never touches HP, inventory, or the equipped items themselves.
const { makeDriver } = require('./drive');
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

function popupCell(container, name) {
  const popup = Array.from(container.querySelectorAll('.kw-sheet')).find((p) => p.textContent.includes('武器の並び替え'));
  if (!popup) return { popup: null, cell: null };
  const cell = Array.from(popup.querySelectorAll('button.kw-cell')).find((b) => b.textContent.includes(name));
  return { popup, cell };
}

const { act } = require('react-dom/test-utils');
function fire(d, el, type, x, y) {
  return act(async () => {
    el.dispatchEvent(new d.env.window.MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    await Promise.resolve();
  });
}
async function tap(d, name) {
  const wrap = popupCell(d.container, name).cell.parentElement;
  await fire(d, wrap, 'pointerdown', 5, 5);
  await fire(d, wrap, 'pointerup', 5, 5);
  await d.flush();
}
function mockRect(el, left, top, size = 100) {
  el.getBoundingClientRect = () => ({ left, top, right: left + size, bottom: top + size, width: size, height: size, x: left, y: top });
}

async function main() {
  // floorNodes() rolls the middle node randomly (55% battle); force a chest so the equip section is always reachable.
  Math.random = () => 0.1;
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click('袋');
  await d.flush();

  const before = d.readJSON(RUN_SAVE_KEY);
  await d.click('並び替え');
  await d.flush();
  const { popup } = popupCell(d.container, '一番目の短剣');
  console.log('[1] reorder popup opened:', !!popup);
  console.log('[2] popup shows weapons only (no armor section):', !!popup && !popup.textContent.includes('防具'));

  await tap(d, '一番目の短剣');
  await tap(d, '三番目の弓');
  await d.flush(400);

  const after = d.readJSON(RUN_SAVE_KEY);
  const ids = after.weapons.map((w) => w && w.id);
  console.log('[3] slots 0 and 2 swapped, slot 1 untouched:', JSON.stringify(ids) === JSON.stringify(['w3', 'w2', 'w1']), ids);
  console.log('[4] no side effects on HP/inventory:', after.player.hp === before.player.hp && after.inv.length === 0);

  // Drag: move slot 0 (now 三番目の弓) onto slot 1 (二番目の斧) => swapped.
  const wraps = ['三番目の弓', '二番目の斧', '一番目の短剣'].map((n) => popupCell(d.container, n).cell.parentElement);
  wraps.forEach((w, i) => mockRect(w, i * 120, 0));
  await fire(d, wraps[0], 'pointerdown', 50, 50);
  await fire(d, wraps[0], 'pointermove', 170, 50);
  await fire(d, wraps[0], 'pointerup', 170, 50);
  await d.flush(400);
  const ids2 = d.readJSON(RUN_SAVE_KEY).weapons.map((w) => w && w.id);
  console.log('[4b] drag swapped slot 0 and 1:', JSON.stringify(ids2) === JSON.stringify(['w2', 'w3', 'w1']), ids2);

  await d.click(d.findButtonContaining('閉じる'));
  await d.flush();
  console.log('[5] popup closed:', !popupCell(d.container, '一番目の短剣').popup);

  const pass = !!popup && !popup.textContent.includes('防具') && JSON.stringify(ids) === JSON.stringify(['w3', 'w2', 'w1'])
    && JSON.stringify(ids2) === JSON.stringify(['w2', 'w3', 'w1']) && after.player.hp === before.player.hp && !popupCell(d.container, '一番目の短剣').popup;
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
