// ITEM-04: warping to another chapter ("章を選ぶ") while sitting on an unclaimed boss-clear
// reward screen (rewardPhase === "clear", drops not yet picked up) must not discard those
// drops. warpToChapter() now auto-collects fromRun.drops (via the same takeAllPure() path
// "拾う" uses) into weapons/armor/inv before building the new floor state.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkAliveRunWithUnclaimedBossReward() {
  return {
    floor: 1, node: 4,
    player: { hp: 50, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '手持ちの短剣', rarity: 'common', atk: 10, asset: 'dagger' }, null, null],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    rewardPhase: 'clear',
    drops: [{ id: 'legendaryDrop', kind: 'weapon', type: 'greatsword', name: '伝説の大剣', rarity: 'legend', atk: 999, asset: 'greatsword' }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 3, checkpoint: 3, discovered: {}, inherited: [] });
  d.seed(RUN_SAVE_KEY, mkAliveRunWithUnclaimedBossReward());
  await d.mount();
  await d.flush();

  console.log('[1] 再開 present (alive run detected):', d.text().includes('再開'));

  await d.click('章を選ぶ');
  await d.flush();
  console.log('[2] chapter picker open:', d.text().includes('章 を 選 ぶ'));

  const ch2Btn = d.findButtonContaining('茸の湿原');
  console.log('[3] chapter 2 button found and enabled:', !!ch2Btn);
  await d.click(ch2Btn);
  await d.flush(500);

  const run = d.readJSON(RUN_SAVE_KEY);
  const inWeapons = (run.weapons || []).some((w) => w && w.id === 'legendaryDrop');
  const inInv = (run.inv || []).some((i) => i.id === 'legendaryDrop');
  console.log('[4] warped to chapter 2:', run.floor === 11);
  console.log('[5] legendary drop preserved (weapons):', inWeapons, 'or (inv):', inInv);
  console.log('[6] drops cleared on new floor (not stuck as duplicate):', (run.drops || []).length === 0 || !run.drops.some((x) => x.id === 'legendaryDrop'));

  const pass = run.floor === 11 && (inWeapons || inInv);
  console.log(pass ? 'PASS' : 'FAIL: unclaimed boss reward lost on chapter warp');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
