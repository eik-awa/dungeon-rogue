// Scenario: the player dies but discards the pending death (via title's "放棄する" or
// "新しく始める") WITHOUT ever visiting the item-pick screen. The recommended top items must
// still be auto-carried into meta.inherited before the run data is wiped, and the immediately-
// started new run must actually contain them (this specifically guards against a stale-closure
// bug: setMeta() is async, so a naive implementation reading `meta` in the same click handler
// that starts the new run would see the pre-update value and lose the item).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkWeapon(atk, extra = {}) {
  return { id: 'w' + atk, kind: 'weapon', type: 'dagger', name: 'テスト短剣' + atk, rarity: 'common', atk, asset: 'dagger', ...extra };
}
function deadRunPayload() {
  return {
    phase: 'dead', floor: 1,
    weapons: [mkWeapon(15), mkWeapon(45)], // 45 should clearly outscore 15 (higher atk)
    armor: { helm: null, armor: null, charm: null },
    inv: [], orbBagBonus: 0, orbSlotBonus: 0,
  };
}

async function runAbandonPath() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1 });
  d.seed(RUN_SAVE_KEY, deadRunPayload());
  await d.mount();
  console.log('--- [放棄する] path ---');

  await d.click('放棄');
  await d.flush();
  await d.click('放棄する');
  await d.flush(50);

  const metaAfter = d.readJSON(SAVE_KEY);
  const gotBetter = (metaAfter.inherited || []).some((x) => x.atk === 45);
  const gotWorse = (metaAfter.inherited || []).some((x) => x.atk === 15); // slots=1, should be excluded
  console.log('[1] meta.inherited auto-populated with the better weapon, excludes the worse one:', gotBetter, !gotWorse);

  await d.click('森 へ 入 る');
  await d.flush(100);
  const run2 = d.readJSON(RUN_SAVE_KEY);
  const allNext = [...(run2.weapons || []).filter(Boolean), ...(run2.inv || [])];
  const carriedIntoGameplay = allNext.some((x) => x.kind === 'weapon' && x.atk === 45);
  console.log('[2] the auto-carried weapon actually appears in the new life\'s gameplay state:', carriedIntoGameplay);

  return gotBetter && !gotWorse && carriedIntoGameplay;
}

async function runNewRunPath() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1 });
  d.seed(RUN_SAVE_KEY, deadRunPayload());
  await d.mount();
  console.log('--- [新しく始める] path (stale-closure regression check) ---');

  await d.click('森 へ 入 る');
  await d.flush();
  await d.click('新しく始める');
  await d.flush(100);

  const run = d.readJSON(RUN_SAVE_KEY);
  const allNext = [...(run.weapons || []).filter(Boolean), ...(run.inv || [])];
  const carried = allNext.some((x) => x.kind === 'weapon' && x.atk === 45);
  console.log('[3] best weapon present in the immediately-started new run (no stale-closure loss):', carried);
  return carried;
}

async function main() {
  const okAbandon = await runAbandonPath();
  const okNewRun = await runNewRunPath();
  console.log(okAbandon ? 'PASS: abandon path' : 'FAIL: abandon path');
  console.log(okNewRun ? 'PASS: new-run path' : 'FAIL: new-run path (stale closure bug!)');
  process.exit(okAbandon && okNewRun ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
