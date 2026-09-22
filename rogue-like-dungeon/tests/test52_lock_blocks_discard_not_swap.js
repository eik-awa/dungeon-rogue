// Policy clarification (user-requested): a locked item's lock should ONLY block discarding it
// ("捨てる") — it must NOT block equipping a replacement over it (weapon swap picker, or armor
// equip). Rationale: even a locked high-rarity weapon gets relatively weaker as stages progress,
// so the player wants to keep swapping gear freely; lock is purely an anti-accidental-discard /
// inheritance-priority marker (see itemScore), not an equip-lock.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 1, // non-battle node so the equip UI is reachable
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [
      { id: 'w1', kind: 'weapon', type: 'dagger', name: '弱い短剣', rarity: 'common', atk: 5, asset: 'dagger' },
      { id: 'w2', kind: 'weapon', type: 'axe', name: 'ロック中の斧', rarity: 'legend', atk: 80, asset: 'axe', locked: true },
      { id: 'w3', kind: 'weapon', type: 'bow', name: '中くらいの弓', rarity: 'common', atk: 20, asset: 'bow' },
    ], // weaponSlotsOf() with no skills is 3 — all full, so equipping a 4th prompts the picker
    armor: { helm: { id: 'h1', kind: 'armor', slot: 'helm', type: 'helm', name: 'ロック中の兜', rarity: 'epic', def: 2, hp: 5, asset: 'helm', locked: true }, armor: null, charm: null },
    inv: [
      { id: 'newWeapon', kind: 'weapon', type: 'staff', name: '新しい杖', rarity: 'common', atk: 10, asset: 'staff' },
      { id: 'newHelm', kind: 'armor', slot: 'helm', type: 'helm', name: '新しい兜', rarity: 'common', def: 1, hp: 2, asset: 'helm' },
    ],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

async function testLockedWeaponCanBeSwappedOut() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, protectRareItems: false });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  const origRandom = Math.random;
  Math.random = () => 0.1;
  try { await d.click('再開'); await d.flush(); } finally { Math.random = origRandom; }

  await d.click('袋・装備');
  await d.flush();
  await d.click(d.findButtonContaining('装備する')); // equip "新しい杖"
  await d.flushUntil(() => d.text().includes('どの武器と交代しますか'));

  const pickerHeading = Array.from(d.container.querySelectorAll('h2')).find((h) => h.textContent.includes('どの武器と交代しますか'));
  const pickerPanel = pickerHeading.closest('.kw-panel');
  const lockedCard = Array.from(pickerPanel.querySelectorAll('button')).find((b) => b.textContent.includes('ロック中の斧'));
  console.log('[1] locked weapon offered as a swap target (not excluded):', !!lockedCard);
  await d.click(lockedCard);
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const lockedWeaponSwappedOut = (run.inv || []).some((it) => it.id === 'w2');
  const newWeaponEquipped = (run.weapons || []).some((w) => w && w.id === 'newWeapon');
  console.log('[2] the locked weapon was sent back to the bag:', lockedWeaponSwappedOut);
  console.log('[3] the new weapon is now equipped in its place:', newWeaponEquipped);
  return !!lockedCard && lockedWeaponSwappedOut && newWeaponEquipped;
}

async function testLockedArmorSwap() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, protectRareItems: false });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  const origRandom = Math.random;
  Math.random = () => 0.1;
  try { await d.click('再開'); await d.flush(); } finally { Math.random = origRandom; }

  await d.click('袋・装備');
  await d.flush();
  const newHelmCard = Array.from(d.container.querySelectorAll('button')).find((b) => b.textContent.includes('新しい兜') && b.textContent.includes('装備する'));
  console.log('[4] the replacement armor\'s "装備する" button found:', !!newHelmCard);
  await d.click(newHelmCard);
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const lockedArmorSwappedOut = (run.inv || []).some((it) => it.id === 'h1');
  const newHelmEquipped = run.armor && run.armor.helm && run.armor.helm.id === 'newHelm';
  console.log('[5] the locked armor was sent back to the bag:', lockedArmorSwappedOut);
  console.log('[6] the new armor is now equipped in its place:', newHelmEquipped);

  // And discard must still be blocked for a locked item sitting in the bag.
  const lockedCardInBag = Array.from(d.container.querySelectorAll('button.kw-cell')).find((b) => b.textContent.includes('ロック中の斧'));
  console.log('[7] the (now-unequipped, still locked) weapon has no "捨てる" option:', lockedCardInBag && !lockedCardInBag.parentElement.textContent.includes('捨てる'));

  return !!newHelmCard && lockedArmorSwappedOut && newHelmEquipped;
}

async function main() {
  const a = await testLockedWeaponCanBeSwappedOut();
  const b = await testLockedArmorSwap();
  console.log(a ? 'PASS: locked weapon can be swapped out via the picker' : 'FAIL: locked weapon swap');
  console.log(b ? 'PASS: locked armor can be swapped out via equip, discard still blocked' : 'FAIL: locked armor swap');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
