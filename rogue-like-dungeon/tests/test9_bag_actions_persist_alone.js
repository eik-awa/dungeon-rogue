// Scenario (#7 from the exploit-audit follow-up): equip/discard/lock/pickup actions must persist
// to storage on their own, without requiring some unrelated later action to save the state for
// them. Previously scheduleSaveRun()/flushSaveRun() calls in these functions were gated behind a
// `committed` variable set inside setG's updater callback, which this component's React 18
// scheduling never populated synchronously — so the debounced save was silently never even
// scheduled. Confirmed via direct window.storage.set instrumentation before the fix (0 calls in
// 500ms after toggling a lock, with no other action taken).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1 });
  d.seed(RUN_SAVE_KEY, {
    floor: 10, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w1', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [{ id: 'i1', kind: 'item', itemId: 'berrySmall', name: 'x', rarity: 'common', asset: 'x' }],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    rewardPhase: 'clear', drops: [],
  });
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click('袋を整理');
  await d.flush();

  const setCalls = [];
  const orig = d.env.window.storage.set;
  d.env.window.storage.set = async (k, v) => { setCalls.push(k); return orig(k, v); };

  const lockBtn = d.findButtonContaining('ロック');
  await d.click(lockBtn);
  await d.flush(500); // no other action taken — this alone must persist

  console.log('storage.set call count after toggling lock alone:', setCalls.length);
  const run = d.readJSON(RUN_SAVE_KEY);
  const gotLock = (run.weapons || []).some((w) => w && w.locked) || (run.inv || []).some((x) => x.locked);
  console.log('persisted run reflects the lock:', gotLock);

  const pass = setCalls.length > 0 && gotLock;
  console.log(pass ? 'PASS: bag action persists on its own' : 'FAIL: bag action still does not persist alone');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
