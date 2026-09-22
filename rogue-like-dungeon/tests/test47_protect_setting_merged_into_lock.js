// Feature (user-requested): "保護" (protect-by-category) settings are merged into the
// per-item "ロック" (lock) mechanism instead of being a separate always-on rule that the
// lock icon can't override:
//   - An item matching an active protect setting (protectHeals / protectRareItems) is
//     auto-locked (it.locked = true) the moment it enters the bag/equipped slots (pickup).
//   - Once auto-locked, pressing that item's own lock icon again releases (unlocks) it —
//     the category setting no longer permanently overrides the per-item lock icon.
//   - Turning a protect setting ON retroactively locks currently-held matching items too.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRunWithDropOnFloor() {
  return {
    floor: 1, node: 0, phase: 'battle',
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [],
    // rarity 'common' so discarding it skips the rare-item confirmation dialog (tested
    // separately elsewhere) — isHighValueItem() matches purely on itemId for dew/mossHeart,
    // independent of rarity, so this still exercises the auto-lock-on-pickup path.
    drops: [{ id: 'epicDrop', kind: 'item', itemId: 'mossHeart', name: '苔の心臓', rarity: 'common', asset: 'mossHeart' }],
    rewardPhase: 'clear',
  };
}

async function testPickupAutoLocksAndIconUnlocks() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, protectRareItems: true });
  d.seed(RUN_SAVE_KEY, mkRunWithDropOnFloor());
  await d.mount();
  await d.click('再開');
  await d.flush();

  // Pick up the epic drop from the reward screen.
  await d.click('拾う');
  await d.flush();
  let run = d.readJSON(RUN_SAVE_KEY);
  let item = (run.inv || []).find((x) => x.id === 'epicDrop');
  console.log('[1] epic item auto-locked on pickup (protectRareItems=true):', item && item.locked === true);

  // Open the bag and press the lock icon once — it should release the auto-lock.
  // The lock-icon button is the immediate sibling right before the "ロック中" status button.
  await d.click('袋を整理');
  await d.flush();
  const lockStatusBtn = Array.from(d.container.querySelectorAll('button')).find((b) => b.textContent.includes('ロック中'));
  const lockIconBtn = lockStatusBtn && lockStatusBtn.previousElementSibling;
  if (lockIconBtn) { await d.click(lockIconBtn); }
  await d.flush();
  run = d.readJSON(RUN_SAVE_KEY);
  item = (run.inv || []).find((x) => x.id === 'epicDrop');
  console.log('[2] pressing the lock icon again releases it (locked === false):', item && item.locked === false);

  // Now discard should work since it's no longer locked, even though the category
  // setting is still ON — the lock icon's own toggle wins, not the global setting.
  await d.click('捨てる');
  await d.flush();
  run = d.readJSON(RUN_SAVE_KEY);
  const stillThere = (run.inv || []).some((x) => x.id === 'epicDrop');
  console.log('[3] item can now be discarded (setting no longer force-overrides the lock icon):', !stillThere);

  return item && item.locked === false && !stillThere;
}

async function testTogglingSettingOnRetroactivelyLocksHeldItems() {
  const d = makeDriver();
  // protectRareItems starts OFF; the player already holds a legendary item, unlocked.
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, protectRareItems: false });
  d.seed(RUN_SAVE_KEY, {
    floor: 1, node: 1,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [{ id: 'legendItem', kind: 'weapon', type: 'greatsword', name: '伝説の大剣', rarity: 'legend', atk: 999, asset: 'greatsword' }],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  });
  await d.mount();
  await d.click('再開');
  await d.flush();

  let run = d.readJSON(RUN_SAVE_KEY);
  let item = (run.inv || []).find((x) => x.id === 'legendItem');
  console.log('[4] item unlocked while the setting is OFF:', item && item.locked !== true);

  // Go to settings (icon-only gear button in the run header) and flip
  // "希少アイテムを保護" ON.
  const gearBtn = Array.from(d.container.querySelectorAll('button.kw-btn.ghost'))
    .find((b) => b.querySelector('svg') && b.textContent.trim() === '');
  await d.click(gearBtn);
  await d.flush();
  // The row's label is a <span>, not the button itself (the button just reads "OFF"/"ON") —
  // find the row containing the label, then click the toggle button inside that row.
  const rareRow = Array.from(d.container.querySelectorAll('div')).find(
    (el) => el.children.length === 2 && el.textContent.includes('希少アイテムを保護') && el.querySelector('button')
  );
  await d.click(rareRow.querySelector('button'));
  await d.flush();

  run = d.readJSON(RUN_SAVE_KEY);
  item = (run.inv || []).find((x) => x.id === 'legendItem');
  console.log('[5] already-held legendary item retroactively locked the moment the setting is switched ON:', item && item.locked === true);

  return item && item.locked === true;
}

async function main() {
  const a = await testPickupAutoLocksAndIconUnlocks();
  const b = await testTogglingSettingOnRetroactivelyLocksHeldItems();
  console.log(a ? 'PASS: pickup auto-locks, and the lock icon alone can release it' : 'FAIL: pickup/unlock flow');
  console.log(b ? 'PASS: switching a protect setting ON retroactively locks currently-held matches' : 'FAIL: retroactive lock on toggle');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
