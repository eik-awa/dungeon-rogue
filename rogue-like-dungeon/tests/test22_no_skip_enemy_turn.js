// BTL-01: interrupting mid-turn ("タイトルへ") must not let a player dodge the enemy's
// counter-attack. attackWith() sets busy:true synchronously before the sleep(650) that leads
// into the enemy's turn, and the header "タイトルへ" button carries disabled={g.busy} (B-4).
//
// Note on the harness: d.click() awaits react-dom/test-utils' act(), which (empirically,
// verified while writing this test) drains the whole async turn — including the real
// setTimeout-based sleep(650)/sleep(380) chain — before it resolves. That means a plain
// `await d.click(weaponBtn)` never observes the "busy" window; it only ever sees the fully
// settled result. So the busy/disabled window is probed here with a raw, non-awaited
// dispatchEvent (bypassing act()'s draining) to catch the DOM synchronously right after
// React's discrete-event flush, which is the realistic moment a second real tap would land.
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'slimeA', bookId: 'slime', name: '森スライム', asset: 'slime', hp: 500, maxHp: 500,
      atk: 8, def: 0, weak: ['斬', '魔'], resist: ['打'], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  const startHp = d.readJSON(RUN_SAVE_KEY).player.hp;
  console.log('[0] starting saved HP:', startHp);

  const weaponBtn = d.findButtonContaining('試験の短剣');
  // A SYNCHRONOUS act() (no async callback) flushes only React's synchronous render commit —
  // it returns before yielding to any microtask/macrotask, so it captures the DOM exactly at
  // the point attackWith has called setG({ busy: true, ... }) but before its `await
  // sleep(650)` gets a chance to resolve. This is the realistic snapshot a second real tap
  // immediately after the first would see.
  act(() => {
    weaponBtn.dispatchEvent(new d.env.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  const titleBtns = d.findAllButtonsContaining('タイトルへ');
  const disabledDuringTurn = titleBtns.length > 0 && titleBtns.every((b) => b.disabled);
  console.log('[1] タイトルへ disabled synchronously right after the attack dispatch:', disabledDuringTurn);

  // Let the enemy's turn fully resolve. NOTE: don't poll on "タイトルへ re-enabled" here —
  // this codebase also has a 3-second busy-stuck watchdog (line ~2414: `useEffect` +
  // `setTimeout(..., 3000)` that force-clears g.busy if untouched). In this harness ALL
  // sleep()s (including that watchdog's real 3000ms one) are sped up to fire on the very next
  // tick, so the watchdog can race ahead of and falsely satisfy a "busy===false" check before
  // enemyPhase's own saveRun() actually runs. Poll the real ground truth instead: the
  // persisted HP actually changing.
  await d.flushUntil(() => d.readJSON(RUN_SAVE_KEY).player.hp !== startHp, { tries: 60 });
  const afterRun = d.readJSON(RUN_SAVE_KEY);
  const endHp = afterRun.player.hp;
  console.log('[2] saved HP after full turn (expect damage taken, i.e. < start):', endHp, 'vs start', startHp,
    '| enemy hp:', afterRun.enemies?.[0]?.hp);

  const reenabled = !!d.findButtonContaining('タイトルへ');
  console.log('[3] タイトルへ re-enabled once the turn settles:', reenabled);

  const pass = disabledDuringTurn && endHp < startHp && reenabled;
  console.log(pass ? 'PASS' : 'FAIL: enemy turn could be skipped by interrupting');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
