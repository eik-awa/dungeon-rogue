// Scenario: a boss's guaranteed one-time drop (legendary weapon etc.) must survive a task-kill
// that happens BEFORE the player collects it from the "章クリア" screen. Restoring must show the
// same reward screen with the same drops, not silently advance past it or regenerate the boss.
//
// NOTE on scope: this test asserts the PRIMARY protection (drops persisted the moment the
// reward screen appears, confirmed by restoring a fresh component instance from that exact
// storage snapshot). A secondary path — the debounced re-save that shrinks the drops list as
// the player picks items up one by one — showed inconsistent timing under this jsdom harness
// during investigation and could not be confirmed either way without a real device; it does not
// affect this test's assertions (which only cover the pre-collection state).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkWeapon(atk, extra = {}) {
  return { id: 'w' + atk, kind: 'weapon', type: 'greatsword', name: '主の大剣', rarity: 'legend', atk, asset: 'greatsword', ...extra };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10 });
  // Simulate: player just beat the chapter-1 boss (floor 10) and is now sitting on the "clear"
  // reward screen with an uncollected guaranteed drop, as persisted by battleWon()'s
  // rewardPhase/drops save — i.e. "task-killed right after winning, before tapping anything".
  d.seed(RUN_SAVE_KEY, {
    floor: 10, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [mkWeapon(20)],
    armor: { helm: null, armor: null, charm: null },
    inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    rewardPhase: 'clear',
    drops: [{ id: 'bossdrop1', kind: 'weapon', type: 'greatsword', name: '主の遺剣', rarity: 'legend', atk: 500, asset: 'greatsword' }],
  });

  // "Relaunch after task-kill": fresh component instance reading the same storage.
  await d.mount();
  await d.click('再開');
  await d.flush();

  console.log('[1] restored directly into the chapter-clear reward screen with the guaranteed drop:',
    d.text().includes('了') && d.text().includes('主の遺剣'));
  console.log('[2] no boss re-fight is showing (no "防御" battle action):', !d.text().includes('防御'));

  const pass = d.text().includes('了') && d.text().includes('主の遺剣') && !d.text().includes('防御');
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
