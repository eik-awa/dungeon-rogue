// ITEM-17 (実バグ発見・修正): 「宝樹の雫からの広告」を見た直後にタスキルすると、報酬が
// 消える不具合。原因は scheduleSaveRun/flushSaveRun/battleWon() が rewardPhase/drops を
// "clear"(章ボス撃破)の時にしか保存していなかったこと。通常/レア敵撃破の戦利品画面
// (phase: "reward" — 金枝の精の宝樹の雫はここに該当)は対象外だったため、
//   1. 敵を倒して phase:"reward" になった瞬間の保存で、未回収ドロップ(雫本体)が
//      即座にディスクから消えていた(画面には残っているが、次回読み込み時には無い)。
//   2. 広告視聴で袋に加わった2個目の雫は(袋に空きがあれば)inv 経由で保存されるが、
//      袋が満杯なら drops 行きになり、同じ理由でやはり保存されない。
//   3. resumeRun() 側にも phase:"reward" 専用の復元分岐が無く、rewardPhase が保存されて
//      いても再開時にボス以外の戦利品画面を復元できなかった。
// これらを、"clear" と "reward" の両方を見る hasUncollectedReward() ヘルパーに統一して修正した。
// このテストは、広告視聴 → タスキル(想定) → 再起動、を通しで検証し、初回撃破分の雫と
// 広告分の雫の両方が生き残ることを確認する。
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 20, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    // 金枝の精(レア)を1撃で倒し、宝樹の雫ドロップ + 雫広告オファーを発生させる。
    enemies: [{ id: 'rareA', bookId: 'wisp', name: '金枝の精', asset: 'wisp', hp: 1, maxHp: 1,
      atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: true, boss: false, fleeIn: 3 }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  await d.click(d.findButtonContaining('試験の短剣'));
  await d.flushUntil(() => d.text().includes('宝 樹 の 雫') || d.text().includes('勝 利'), { tries: 60 });
  console.log('[1] dew-ad offer shown after killing the rare enemy:', d.text().includes('宝 樹 の 雫'));

  // Right when the reward screen first appears (before the ad, before "拾う"), the save must
  // already carry the original uncollected drop — this is the FIRST place the old bug lost it.
  let run = d.readJSON(RUN_SAVE_KEY);
  console.log('[2] uncollected drop already persisted the instant the reward screen appears:',
    run.rewardPhase === 'reward' && (run.drops || []).some((it) => it.itemId === 'dew'));

  const adBtn = d.findButtonContaining('広 告 を 見 る');
  await d.click(adBtn);
  await act(async () => { d.env.window.__onRewardAdResult__('dew', 'rewarded'); });
  await d.flush();

  // Do NOT click "拾う"/"全部拾う"/"先へ進む" — simulate a task-kill right after the ad,
  // exactly matching the user's report.
  run = d.readJSON(RUN_SAVE_KEY);
  const adDew = (run.inv || []).some((it) => it.itemId === 'dew');
  const originalDewStillInDrops = (run.drops || []).some((it) => it.itemId === 'dew');
  console.log('[3] ad-granted dew saved to inv:', adDew);
  console.log('[4] original encounter\'s dew STILL saved in drops (not silently dropped):', originalDewStillInDrops);
  console.log('[5] rewardPhase saved as "reward":', run.rewardPhase === 'reward');

  // "Relaunch after task-kill": a fresh component instance reading the same storage must
  // restore the reward screen itself (not regenerate a new battle), with both dews intact.
  const d2 = makeDriver();
  d2.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d2.seed(RUN_SAVE_KEY, run);
  await d2.mount();
  await d2.click('再開');
  await d2.flush();

  const restoredToReward = d2.text().includes('勝 利') && !d2.text().includes('防御');
  console.log('[6] resumed straight into the reward screen (not a freshly regenerated battle):', restoredToReward);

  await d2.click('全部拾う');
  await d2.flush();
  const finalRun = d2.readJSON(RUN_SAVE_KEY);
  const totalDew = (finalRun.inv || []).filter((it) => it.itemId === 'dew').length;
  console.log('[7] both dews present after collecting everything (expect 2):', totalDew);

  const pass = run.rewardPhase === 'reward' && originalDewStillInDrops && adDew && restoredToReward && totalDew === 2;
  console.log(pass ? 'PASS' : 'FAIL: dew reward(s) lost across a task-kill right after the ad');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
