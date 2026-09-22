// ITEM-15 (実バグ発見・修正): 袋が満杯でドロップの回収に失敗すると g.full=true になり、
// 赤枠の「袋がいっぱいで拾えませんでした」通知(kw-notice)が出る。この通知は takeDropPure の
// 成功時か tryProceed/proceedLeaving でのノード遷移時にしか false へ戻らないため、
// useItem/discardItem で袋に空きを作っても g.full は true のまま残り、実際にはもう拾えるのに
// 通知が消えずに残り続けていた(実バグ発見・修正: 通知条件に `g.inv.length >= invCap` の
// ライブ判定を追加し、袋に空きができた時点で自動的に消えるようにした)。
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  const filler = Array.from({ length: 13 }, (_, i) => ({
    id: `filler${i}`, kind: 'item', itemId: 'antidote', name: '毒消し草', rarity: 'common', asset: 'antidote',
  }));
  const inv = [
    { id: 'heal1', kind: 'item', itemId: 'berrySmall', name: '癒しの実', rarity: 'common', asset: 'berrySmall' },
    ...filler,
  ]; // 14 items = invCapOf() with no skills (14)
  return {
    floor: 10, node: 0,
    player: { hp: 40, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w1', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv,
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    rewardPhase: 'clear',
    // kind: 'item' drop (not weapon/armor) so takeDropPure must go through the
    // inv.length >= invCap gate instead of auto-equipping into a free weapon/armor slot.
    drops: [{ id: 'bossdrop1', kind: 'item', itemId: 'berryBig', name: '大きな木の実', rarity: 'rare', asset: 'berryBig' }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  // Try to pick up the drop -> fails, bag is full (14/14) -> g.full=true, notice shows.
  await d.click('拾う');
  await d.flush();
  const failedPickup = !d.readJSON(RUN_SAVE_KEY).inv.some((x) => x.id === 'bossdrop1');
  const noticeAfterFail = d.text().includes('袋がいっぱいで拾えませんでした');
  console.log('[1] pickup correctly failed (bag full):', failedPickup);
  console.log('[2] red "満杯" notice shown right after the failed pickup:', noticeAfterFail);

  // Free exactly one slot by USING an item from the bag (not by picking up/discarding a drop).
  await d.click('袋を整理');
  await d.flush();
  await d.click('使う');
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const noticeAfterUse = d.text().includes('袋がいっぱいで拾えませんでした');
  console.log('[3] inv.length after using an item (expect 13, room freed):', run.inv.length);
  console.log('[4] red notice still shown after space was freed (must be false):', noticeAfterUse);

  const pass = failedPickup && noticeAfterFail && run.inv.length === 13 && !noticeAfterUse;
  console.log(pass ? 'PASS' : 'FAIL: stale red "満杯" notice persists after item use frees bag space');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
