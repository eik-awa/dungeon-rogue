// PROG-01 / PROG-02: double-clicking "先へ進む →" must not advance the floor/node twice, and
// whatever enemies end up persisted to RUN_SAVE_KEY must match what's actually shown on
// screen. tryProceed() reads gRef.current synchronously (not a functional setG updater), so a
// same-tick double-fire computes nextNode() twice from the SAME pre-advance snapshot rather
// than compounding (node+1 twice, not node+2) — this locks in that invariant, plus verifies
// the final persisted enemies match the ones actually rendered after the node transition.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  // node:1, no `enemies` -> resumeRun() goes through enterNode() for the mid-slot node.
  // floorNodes()'s mid slot is chosen by two Math.random() calls, stubbed at click-time below
  // to deterministically land on "spring" (heal fountain, no combat setup needed).
  return {
    floor: 1, node: 1,
    player: { hp: 40, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();

  const origRandom = Math.random;
  Math.random = () => 0.1; // 1st call <0.45 (mid exists), 2nd call <0.55 -> "chest"... need spring
  // floorNodes(): Math.random()<0.45 (yes w/ 0.1) then Math.random()<0.55 -> to get "spring"
  // we need the SECOND call to be >=0.55. Use a tiny queue instead of a flat stub.
  const queue = [0.1, 0.9];
  Math.random = () => (queue.length ? queue.shift() : 0.9);
  try {
    await d.click('再開');
    await d.flush();
  } finally {
    Math.random = origRandom;
  }
  console.log('[0] landed on spring node:', d.text().includes('月映しの泉'));

  // Drink (sets eventDone:true). Force the 35%-chance bonus drop off so `drops` stays empty
  // and tryProceed() goes straight to nextNode() instead of stopping at a drops-confirm.
  const origRandom2 = Math.random;
  Math.random = () => 0.9;
  try {
    await d.click('水を飲む');
    await d.flush();
  } finally {
    Math.random = origRandom2;
  }
  console.log('[1] event done, no bonus drop:', d.text().includes('傷と毒を洗い流した'));

  const beforeNode = d.readJSON(RUN_SAVE_KEY).node;
  console.log('[2] node before proceeding (expect 1):', beforeNode);

  const proceedBtn = d.findButtonContaining('先へ進む');
  await d.doubleClickRace(proceedBtn);
  await d.flush(200);

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[3] node after double-click race (expect exactly 2, i.e. +1 not +2):', run.node, 'floor:', run.floor);
  const advancedByOne = run.floor === 1 && run.node === 2;

  // PROG-02: whatever landed (should be node 2 = "battle", the 3rd slot), the persisted
  // enemies must be exactly what's shown on screen.
  const screenText = d.text();
  let enemiesConsistent = true;
  if (run.enemies && run.enemies.length > 0) {
    for (const e of run.enemies) {
      if (!screenText.includes(e.name)) { enemiesConsistent = false; break; }
    }
  }
  console.log('[4] persisted enemies all shown on screen:', enemiesConsistent, JSON.stringify((run.enemies || []).map((e) => e.name)));

  const pass = advancedByOne && enemiesConsistent;
  console.log(pass ? 'PASS' : 'FAIL: proceed button double-click advanced more than once or enemies mismatched');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
