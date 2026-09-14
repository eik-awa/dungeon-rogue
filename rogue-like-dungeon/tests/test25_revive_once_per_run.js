// AD-01: the reward-ad revive offer must be usable at most once per run. After a rewarded-ad
// revive, dying again in the SAME run must go straight to the death/inherit screen — never a
// second reviveOffer — because finalizeDeath's gate checks both the run-local `reviveUsed`
// flag AND the persisted `meta.reviveUsedThisRun` flag (set together by the ad-result
// callback), so the block survives even a chapter warp in between (meta persists across it).
//
// This also regression-guards the fix for a real non-persistence bug found while writing this
// test: window.__onRewardAdResult__ used to gate flushSaveRun() behind a `committed` variable
// only ever set inside a setG(updater) callback — but since this callback is invoked directly
// by the native bridge (not a React SyntheticEvent), that updater isn't guaranteed to run
// synchronously, so `committed` could stay null and the revive would show live on screen but
// never actually get saved. We check enemies[0].hp (drained by the pre-death attack) rather
// than just player.hp, because a full-HP player after revive (72) is indistinguishable from
// the untouched seed data — enemy HP is not, so it proves a real save happened.
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 1, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    // atk is absurdly high so a single counter-attack always one-shots the player regardless
    // of current HP, letting us reliably force death twice in the same run.
    enemies: [{ id: 'slimeA', bookId: 'slime', name: '森スライム', asset: 'slime', hp: 999999, maxHp: 999999,
      atk: 9999, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  // --- First death: reviveOffer should appear ---
  await d.click(d.findButtonContaining('試験の短剣'));
  await d.flushUntil(() => d.text().includes('広告') || d.text().includes('継承'), { tries: 60 });
  const offeredFirstTime = d.text().includes('復活') || !!d.findButtonContaining('広告');
  console.log('[1] reviveOffer shown on first death:', offeredFirstTime);

  // Request the ad (sets g.rewardAdPending:"revive", same as a real tap), then simulate the
  // native ad SDK's rewarded callback directly — window.__onRewardAdResult__ is what the
  // native bridge calls; the callback guards on rewardAdPending matching, so it must be set
  // first or the revive is silently ignored.
  await d.click('広告を見て復活する');
  await act(async () => { d.env.window.__onRewardAdResult__('revive', 'rewarded'); });
  await d.flush();
  const revivedRun = d.readJSON(RUN_SAVE_KEY);
  const revivedHp = revivedRun?.player?.hp;
  const enemyHpPersisted = revivedRun?.enemies?.[0]?.hp;
  console.log('[2] revived with full HP:', revivedHp, '| persisted enemy HP shows the pre-death damage (< 999999, not the untouched seed):', enemyHpPersisted);

  // --- Second death in the SAME run: must NOT offer revive again ---
  await d.click(d.findButtonContaining('試験の短剣'));
  await d.flushUntil(() => d.text().includes('旅人は倒れた') || d.text().includes('力尽きかけている'), { tries: 60 });
  const offeredSecondTime = d.text().includes('力尽きかけている');
  const onDeathScreen = d.text().includes('旅人は倒れた');
  console.log('[3] reviveOffer NOT shown on second death:', !offeredSecondTime, '| death/inherit screen shown:', onDeathScreen);

  const pass = offeredFirstTime && revivedHp === 72 && enemyHpPersisted < 999999 && !offeredSecondTime && onDeathScreen;
  console.log(pass ? 'PASS' : 'FAIL: revive was usable more than once per run, or the revive state was never actually saved');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
