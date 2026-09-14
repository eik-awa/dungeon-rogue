// Scenario (explicit product decision): an interrupted run — alive or dead — must NEVER be
// silently discardable from the title screen. The "だい◯章から続ける" primary button and the
// "放棄" (abandon) button, which both used to let a player wipe an active/dead run's data
// (confirmed via a real S-1 bug and confusing UX reports), have been removed entirely.
// Whenever `savedRun` exists, the ONLY path forward is "再開" (alive) or "転生を選ぶ" (dead).
// "章を選ぶ" stays available for a live run since it's a non-destructive warp.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

async function testNoSavedRun() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 3 });
  await d.mount();
  const t = d.text();
  console.log('[no-run] primary continue button present:', t.includes('第3章から続ける'));
  console.log('[no-run] 章を選ぶ present:', t.includes('章を選ぶ'));
  console.log('[no-run] no 放棄 anywhere:', !t.includes('放棄'));
  return t.includes('第3章から続ける') && t.includes('章を選ぶ') && !t.includes('放棄');
}

async function testAliveSavedRun() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 3 });
  d.seed(RUN_SAVE_KEY, {
    floor: 21, node: 0,
    player: { hp: 30, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w1', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  });
  await d.mount();
  const t = d.text();
  console.log('[alive] 再開 present:', t.includes('再開'));
  console.log('[alive] primary "続ける" CTA absent:', !t.includes('第3章から続ける'));
  console.log('[alive] 放棄 absent:', !t.includes('放棄'));
  console.log('[alive] 章を選ぶ still present (safe warp):', t.includes('章を選ぶ'));
  return t.includes('再開') && !t.includes('第3章から続ける') && !t.includes('放棄') && t.includes('章を選ぶ');
}

async function testDeadSavedRun() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 3 });
  d.seed(RUN_SAVE_KEY, {
    phase: 'dead', floor: 21,
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w1', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    orbBagBonus: 0, orbSlotBonus: 0,
  });
  await d.mount();
  const t = d.text();
  console.log('[dead] 転生を選ぶ present:', t.includes('転生を選ぶ'));
  console.log('[dead] primary "続ける" CTA absent:', !t.includes('第3章から続ける'));
  console.log('[dead] 放棄 absent:', !t.includes('放棄'));
  return t.includes('転生を選ぶ') && !t.includes('第3章から続ける') && !t.includes('放棄');
}

async function main() {
  const a = await testNoSavedRun();
  const b = await testAliveSavedRun();
  const c = await testDeadSavedRun();
  console.log(a ? 'PASS: fresh title screen unaffected' : 'FAIL: fresh title screen');
  console.log(b ? 'PASS: alive interrupted run cannot be silently discarded' : 'FAIL: alive case');
  console.log(c ? 'PASS: dead interrupted run cannot be silently discarded' : 'FAIL: dead case');
  process.exit(a && b && c ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
