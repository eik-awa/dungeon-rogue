// Companion to test48: the same "reward" phase (non-boss victory, e.g. a rare enemy's 宝樹の雫)
// must also keep its uncollected drops through the other two paths that read/write
// rewardPhase, which had the exact same "clear"-only gap as scheduleSaveRun/flushSaveRun:
//   - the explicit "中断してタイトルへ" (pause to title) button's own saveRun call
//   - warpToChapter()'s pre-warp "collect everything first" guard
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRewardRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 20, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    // Already sitting on the reward screen (as battleWon() would save it after the fix),
    // with an uncollected dew — nothing picked up yet.
    rewardPhase: 'reward',
    drops: [{ id: 'dew1', kind: 'item', itemId: 'dew', name: '宝樹の雫', rarity: 'rare', asset: 'dew' }],
  };
}

async function testPauseToTitlePreservesDrop() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRewardRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  await d.click('タイトルへ');
  await d.flush();
  await d.click('中断してタイトルへ');
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const preserved = run.rewardPhase === 'reward' && (run.drops || []).some((it) => it.itemId === 'dew');
  console.log('[1] explicit "中断してタイトルへ" preserves the uncollected reward-screen drop:', preserved);
  return preserved;
}

async function testWarpCollectsDropFirst() {
  const d = makeDriver();
  // checkpoint 2 so chapter 2 is warp-able from the title's "章を選ぶ". The savedRun sits in
  // chapter 1 (floor 1), so warping to chapter 2 is a genuine cross-chapter warp — warping to
  // the CURRENT chapter is disabled ("今いる章") and would be a no-op that proves nothing.
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 2, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, mkRewardRun());
  await d.mount();
  await d.flush();

  const chapterSelectBtn = d.findButtonContaining('章を選ぶ');
  console.log('[2a] "章を選ぶ" button found:', !!chapterSelectBtn);
  await d.click(chapterSelectBtn);
  await d.flush();
  const ch2 = d.findButtonContaining('第2章');
  console.log('[2b] chapter-2 tile found and enabled:', !!ch2);
  await d.click(ch2);
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[2c] warp actually happened (floor moved into chapter 2):', run.floor === 11);
  const dewSomewhere = (run.inv || []).some((it) => it.itemId === 'dew') || (run.drops || []).some((it) => it.itemId === 'dew');
  console.log('[2] warping out of an uncollected "reward" screen still collects the drop first (dew not lost):', dewSomewhere);
  return !!chapterSelectBtn && !!ch2 && run.floor === 11 && dewSomewhere;
}

async function main() {
  const a = await testPauseToTitlePreservesDrop();
  const b = await testWarpCollectsDropFirst();
  console.log(a ? 'PASS: pause-to-title keeps the reward-screen drop' : 'FAIL: pause-to-title lost it');
  console.log(b ? 'PASS: warping collects the reward-screen drop first' : 'FAIL: warp silently discarded it');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
