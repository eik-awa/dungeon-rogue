// BTL-03: double-clicking a weapon card (or racing two different weapon cards) in the same
// tick must not land two attacks in one turn. attackWith() guards on `st0.busy` read from
// gRef.current synchronously at the top, and the first call's setG({...busy:true}) commits
// before the second call in the same act() batch runs, so the second call's `st0.busy` read
// sees true and bails out.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [
      { id: 'w1', kind: 'weapon', type: 'greatsword', name: '試験の大剣', rarity: 'common', atk: 20, asset: 'greatsword' },
      { id: 'w2', kind: 'weapon', type: 'bow', name: '試験の弓', rarity: 'common', atk: 20, asset: 'bow' },
    ],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'slimeA', bookId: 'slime', name: '森スライム', asset: 'slime', hp: 5000, maxHp: 5000,
      atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
  };
}

async function testSameCardDoubleClick() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  const before = d.readJSON(RUN_SAVE_KEY).enemies[0].hp;
  const btn = d.findButtonContaining('試験の大剣');
  await d.doubleClickRace(btn);
  // Poll ground truth (persisted enemy HP), not "タイトルへ re-enabled" — see the note in
  // drive.js's flushUntil() about the busy-stuck watchdog racing ahead under sped-up timers.
  await d.flushUntil(() => d.readJSON(RUN_SAVE_KEY).enemies?.[0]?.hp !== before, { tries: 60 });
  const after = d.readJSON(RUN_SAVE_KEY);
  const dmg = before - (after.enemies?.[0]?.hp ?? 0);
  // Greatsword raw hit = atk(20) * mult(2.2) ~= 44, rounded w/ rnd(0.9,1.1) => roughly 38-48.
  // A double-fire would land ~2x that (~80-95+). Give generous headroom below 2x.
  console.log('[same-card] damage dealt from one doubleClickRace:', dmg, '(single-hit ballpark, not ~2x)');
  return dmg > 0 && dmg < 70;
}

async function testDifferentCardsRace() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  const beforeState = d.readJSON(RUN_SAVE_KEY);
  const before = beforeState.enemies[0].hp;
  const beforeHp = beforeState.player.hp;
  const btnA = d.findButtonContaining('試験の大剣');
  const btnB = d.findButtonContaining('試験の弓');
  await d.raceClicks(btnA, btnB);
  // The enemy here has atk:0, but enemyPhase's dmg formula is `Math.max(1, ...)`, so the
  // player always loses at least 1 HP once the (guaranteed-to-run) enemy turn completes —
  // a reliable ground-truth "the whole turn, not just the watchdog, actually finished" signal
  // even in the (valid) case where neither weapon click landed a hit at all.
  await d.flushUntil(() => d.readJSON(RUN_SAVE_KEY).player.hp !== beforeHp, { tries: 60 });
  const after = d.readJSON(RUN_SAVE_KEY);
  const dmg = before - (after.enemies?.[0]?.hp ?? 0);
  // Only ONE of the two weapons may land a hit this turn — never both (that would be the
  // actual exploit: ~2x damage from a single turn). Racing two DIFFERENT buttons in the exact
  // same synchronous tick is an even tighter race than a real double-tap can produce (a real
  // user's two taps are always separated by real browser event-loop turns), so the busy-guard
  // occasionally erring toward "neither lands" here (0 damage) is the same safe direction as
  // every other guard in this codebase (skip on ambiguity, never double-apply) — not a bug.
  console.log('[cross-card] damage dealt from racing two different weapons:', dmg, '(expect at most single-weapon ballpark, never ~2x)');
  return dmg < 70;
}

async function main() {
  const a = await testSameCardDoubleClick();
  const b = await testDifferentCardsRace();
  console.log(a ? 'PASS: same-card double click cannot double-attack' : 'FAIL: same-card double attack landed');
  console.log(b ? 'PASS: racing two different weapons cannot double-attack' : 'FAIL: cross-weapon double attack landed');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
