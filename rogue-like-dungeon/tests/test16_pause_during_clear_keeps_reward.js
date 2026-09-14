// Scenario (S-3, silent loss): pressing "中断してタイトルへ" (pause to title) while on the
// "章クリア" screen (uncollected guaranteed boss drop still showing) used to call saveRun()
// without rewardPhase/drops, silently discarding the guaranteed drop and the in-memory
// `savedRun` React state used to immediately resume — the title's "再開" button would restore
// into a regenerated boss fight instead of the reward screen. Fixed by threading
// rewardPhase/drops through both the persisted saveRun() call and the `rd` object.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10 });
  d.seed(RUN_SAVE_KEY, {
    floor: 10, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w1', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    rewardPhase: 'clear',
    drops: [{ id: 'bossdrop1', kind: 'weapon', type: 'greatsword', name: '主の遺剣', rarity: 'legend', atk: 500, asset: 'greatsword' }],
  });
  await d.mount();
  await d.click('再開');
  await d.flush();
  console.log('[1] on the clear screen with the guaranteed drop:', d.text().includes('主の遺剣'));

  await d.click('タイトルへ');
  await d.flush();
  await d.click('中断してタイトルへ');
  await d.flush(100);

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[2] persisted rewardPhase:', run.rewardPhase, ' drops kept:', (run.drops || []).some((x) => x.id === 'bossdrop1'));
  const persistedOk = run.rewardPhase === 'clear' && (run.drops || []).some((x) => x.id === 'bossdrop1');

  // Also confirm the in-memory savedRun (used for immediate "再開" without a reload) carries it.
  console.log('[3] title screen offers 再開 (not stuck on nothing):', d.text().includes('再開'));
  await d.click('再開');
  await d.flush();
  console.log('[4] resuming restores the clear screen with the drop, not a regenerated boss:',
    d.text().includes('主の遺剣') && !d.text().includes('防御'));
  const resumedOk = d.text().includes('主の遺剣') && !d.text().includes('防御');

  const pass = persistedOk && resumedOk;
  console.log(pass ? 'PASS' : 'FAIL: reward lost when pausing from the clear screen');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
