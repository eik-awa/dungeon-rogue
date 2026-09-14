// UI-03: the death/inherit screen's "選択 n / m" denominator must match the ACTUAL cap that
// togglePick() enforces (`g.effSlots ?? meta.slots`), not a stale/different value. Both the
// display and togglePick() read the exact same expression, so this is a regression guard
// against someone changing one without the other — e.g. a display that shows meta.slots while
// the real cap (inflated by orbSlotBonus, "宝珠") is actually effSlots (a higher number).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkDeadRun() {
  // 5 unlocked items, more than the cap, so recommendPick() fills up to the cap (not fewer).
  const items = Array.from({ length: 5 }, (_, i) => ({
    id: `it${i}`, kind: 'item', itemId: 'antidote', name: `試験アイテム${i}`, rarity: 'common', asset: 'antidote',
  }));
  return {
    phase: 'dead', floor: 5,
    weapons: [], armor: { helm: null, armor: null, charm: null }, inv: items,
    orbBagBonus: 0, orbSlotBonus: 2, // effSlots = meta.slots(2) + orbSlotBonus(2) = 4, NOT meta.slots alone
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 2, checkpoint: 1, discovered: {}, inherited: [] });
  d.seed(RUN_SAVE_KEY, mkDeadRun());
  await d.mount();
  await d.flush();
  await d.click('転生を選ぶ');
  await d.flush();

  const t = d.text();
  const displayedCap = t.includes('選択 4 / 4');
  console.log('[1] death screen displays "選択 4 / 4" (effSlots, not meta.slots=2):', displayedCap, JSON.stringify(t.replace(/\s+/g, ' ').match(/選択 \d+ \/ \d+/)));

  // Confirm togglePick() actually enforces that same 4-item cap: all 5 items are unlocked and
  // pickable, but only 4 can ever be selected at once.
  const pickedButtons = Array.from(d.container.querySelectorAll('button')).filter(
    (b) => b.textContent.includes('✓ 持っていく') || b.textContent.includes('🔒✓')
  );
  console.log('[2] exactly 4 items pre-selected by recommendPick (matches the cap, not 5):', pickedButtons.length);

  const pass = displayedCap && pickedButtons.length === 4;
  console.log(pass ? 'PASS' : 'FAIL: displayed slot cap does not match the actual enforced cap');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
