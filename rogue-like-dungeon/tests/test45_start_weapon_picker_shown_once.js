// ITEM-16 (実バグ発見・修正): タイトル画面の「はじめの武器を選ぶ」は、これまで
// meta.inherited (直近の転生で持ち越した品) が空かどうかで表示を決めていた。しかし
// inherited はラン開始時に必ず一旦空にされ、中断してタイトルへ戻っただけでも空のまま
// なので、一度でも武器を持ったことがある(=一度でもラン開始したことがある)経験者でも、
// 中断してタイトルに戻るたびに「はじめの武器を選ぶ」が毎回出てしまっていた。
// starterState() はラン開始時に必ず武器を1本持たせる(空きスロットが無ければ補充する)ため、
// 「一度でもラン開始したか」を表す永続フラグ meta.everHadWeapon で判定するよう修正した。
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

async function testFreshSaveShowsPickerThenNeverAgain() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1 }); // truly fresh: everHadWeapon absent -> defaults false
  await d.mount();
  console.log('[1] brand-new save shows the starting-weapon picker:', d.text().includes('はじめの武器を選ぶ'));

  await d.click('斧');
  await d.click('森 へ 入 る');
  await d.flush(100);
  const metaAfterStart = d.readJSON(SAVE_KEY);
  console.log('[2] everHadWeapon persisted true after starting a run:', metaAfterStart.everHadWeapon === true);
  console.log('[3] inherited is empty right after run start (expected, and NOT what gates the picker anymore):', (metaAfterStart.inherited || []).length === 0);

  // Pause back to title WITHOUT dying. This is the exact regression scenario:
  // inherited stays empty, but the player obviously already has a weapon equipped.
  await d.click('タイトルへ');
  await d.flush(50);
  await d.click('中断してタイトルへ');
  await d.flush(100);
  const pickerShownAfterPause = d.text().includes('はじめの武器を選ぶ');
  console.log('[4] picker NOT shown again after pausing mid-run (no death, inherited still empty):', !pickerShownAfterPause);

  return metaAfterStart.everHadWeapon === true && !pickerShownAfterPause;
}

async function testLegacySaveBackfilled() {
  const d = makeDriver();
  // A pre-existing experienced player's save from before everHadWeapon existed:
  // clear progress on record, but the key is simply absent (old schema).
  d.seed(SAVE_KEY, { slots: 2, checkpoint: 3, bestFloor: 21, deaths: 2, clears: 2, inherited: [] });
  await d.mount();
  await d.flush(50);
  const pickerShown = d.text().includes('はじめの武器を選ぶ');
  console.log('[5] legacy experienced-player save does NOT show the picker (backfilled on load):', !pickerShown);
  const meta = d.readJSON(SAVE_KEY);
  console.log('[6] everHadWeapon backfilled to true and persisted:', meta.everHadWeapon === true);
  return !pickerShown && meta.everHadWeapon === true;
}

async function main() {
  const a = await testFreshSaveShowsPickerThenNeverAgain();
  const b = await testLegacySaveBackfilled();
  console.log(a ? 'PASS: picker shown once for a new player, never again after their first run start' : 'FAIL: fresh-save/pause-to-title flow');
  console.log(b ? 'PASS: legacy experienced-player saves are backfilled and never see the picker' : 'FAIL: legacy backfill');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
