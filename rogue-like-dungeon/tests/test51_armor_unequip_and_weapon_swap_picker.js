// Two fixes in one pass (both outside battle, per the reverted policy in test50):
//   1. Tapping an equipped armor piece used to be a literal no-op (onClick={() => {}}).
//      It must now unequip it into the bag, mirroring unequipWeapon, and correctly reverse
//      the HP bonus it granted.
//   2. Equipping a weapon from the bag while all weapon slots are full used to silently
//      auto-swap the lowest-atk unlocked weapon. The player found this surprising/unwanted
//      ("勝手に対象切り替えられると不便"); it must now open a picker so the player explicitly
//      chooses which equipped weapon to send back to the bag.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 1, // non-battle node so the bag's equip management is reachable
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [
      { id: 'w1', kind: 'weapon', type: 'dagger', name: '弱い短剣', rarity: 'common', atk: 5, asset: 'dagger' },
      { id: 'w2', kind: 'weapon', type: 'axe', name: '強い斧', rarity: 'legend', atk: 80, asset: 'axe' },
      { id: 'w3', kind: 'weapon', type: 'bow', name: '中くらいの弓', rarity: 'common', atk: 20, asset: 'bow' },
    ], // weaponSlotsOf() with no skills is 3 — all 3 slots full, so equipping a 4th must prompt
    armor: { helm: { id: 'h1', kind: 'armor', slot: 'helm', type: 'helm', name: '試験の兜', rarity: 'common', def: 2, hp: 5, asset: 'helm' }, armor: null, charm: null },
    inv: [
      { id: 'newWeapon', kind: 'weapon', type: 'bow', name: '新しい弓', rarity: 'epic', atk: 40, asset: 'bow' },
    ],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

async function testArmorUnequip() {
  const d = makeDriver();
  // protectRareItems explicitly OFF: this test is about the swap picker letting the player
  // choose ANY equipped weapon, not about lock-interaction (that's covered by test47).
  // Without this, the default-ON protect setting would auto-lock the legendary "強い斧"
  // on resume and the picker would correctly (but confusingly, for this test) refuse it.
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, protectRareItems: false });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  const origRandom = Math.random;
  Math.random = () => 0.1; // force floorNodes' mid slot to "chest" (non-battle), like test39/test21
  try {
    await d.click('再開');
    await d.flush();
  } finally {
    Math.random = origRandom;
  }

  const hpBefore = d.readJSON(RUN_SAVE_KEY).player.hp;
  await d.click('袋・装備');
  await d.flush();
  const armorCard = Array.from(d.container.querySelectorAll('button.kw-cell')).find((b) => b.textContent.includes('試験の兜'));
  console.log('[1] equipped armor card found:', !!armorCard);
  await d.click(armorCard);
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const stillEquipped = !!(run.armor && run.armor.helm);
  const inInv = (run.inv || []).some((it) => it.id === 'h1');
  const hpDropped = run.player.hp === hpBefore - 5;
  console.log('[2] armor unequipped from its slot:', !stillEquipped);
  console.log('[3] armor moved into the bag:', inInv);
  console.log('[4] HP bonus correctly reversed (-5):', hpDropped, run.player.hp, hpBefore);
  return !stillEquipped && inInv && hpDropped;
}

async function testWeaponSwapPicker() {
  const d = makeDriver();
  // protectRareItems explicitly OFF: this test is about the swap picker letting the player
  // choose ANY equipped weapon, not about lock-interaction (that's covered by test47).
  // Without this, the default-ON protect setting would auto-lock the legendary "強い斧"
  // on resume and the picker would correctly (but confusingly, for this test) refuse it.
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, protectRareItems: false });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  const origRandom = Math.random;
  Math.random = () => 0.1; // force floorNodes' mid slot to "chest" (non-battle), like test39/test21
  try {
    await d.click('再開');
    await d.flush();
  } finally {
    Math.random = origRandom;
  }

  await d.click('袋・装備');
  await d.flush();
  await d.click(d.findButtonContaining('装備する')); // equip "新しい弓" — both weapon slots are full
  await d.flushUntil(() => d.text().includes('どの武器と交代しますか'));

  const pickerShown = d.text().includes('どの武器と交代しますか');
  console.log('[5] swap picker shown instead of auto-swapping:', pickerShown);
  // Confirm it did NOT silently auto-pick the lowest-atk weapon already.
  const midRun = d.readJSON(RUN_SAVE_KEY);
  const notAutoSwappedYet = (midRun.weapons || []).some((w) => w && w.id === 'w1') && (midRun.weapons || []).some((w) => w && w.id === 'w2');
  console.log('[6] neither original weapon has been swapped out yet (waiting on player choice):', notAutoSwappedYet);

  // Explicitly choose to replace the STRONG weapon (w2), not the weak one — proving the
  // player controls the target rather than the old "always swap lowest atk" auto-logic.
  // NOTE: the underlying "袋・装備" overlay is still open behind this picker and shares the
  // same .kw-overlay.top class (and also shows "強い斧" as its own equipped-weapon card, whose
  // tap target is unequipWeapon — a different action) — scope the query to the picker panel
  // itself (found via its unique heading) so the two "強い斧" buttons can't be conflated.
  const pickerHeading = Array.from(d.container.querySelectorAll('h2')).find((h) => h.textContent.includes('どの武器と交代しますか'));
  const pickerPanel = pickerHeading.closest('.kw-panel');
  const strongCard = Array.from(pickerPanel.querySelectorAll('button')).find((b) => b.textContent.includes('強い斧'));
  console.log('[7] can pick the strong weapon as the swap target (not forced to the weakest):', !!strongCard);
  await d.click(strongCard);
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const weakStillEquipped = (run.weapons || []).some((w) => w && w.id === 'w1');
  const strongNowInBag = (run.inv || []).some((it) => it.id === 'w2');
  const newWeaponEquipped = (run.weapons || []).some((w) => w && w.id === 'newWeapon');
  console.log('[8] the untouched weak weapon is still equipped:', weakStillEquipped);
  console.log('[9] the chosen (strong) weapon went to the bag instead:', strongNowInBag);
  console.log('[10] the new weapon is now equipped:', newWeaponEquipped);

  return pickerShown && notAutoSwappedYet && !!strongCard && weakStillEquipped && strongNowInBag && newWeaponEquipped;
}

async function main() {
  const a = await testArmorUnequip();
  const b = await testWeaponSwapPicker();
  console.log(a ? 'PASS: armor unequip works and reverses its HP bonus' : 'FAIL: armor unequip');
  console.log(b ? 'PASS: weapon swap requires an explicit player choice, not auto-pick' : 'FAIL: weapon swap picker');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
