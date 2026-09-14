// AD-02: the reward-ad dew-doubling reward must be persisted immediately when the ad result
// arrives — not only once the player later collects it from the reward screen or advances a
// floor. This is a REAL regression catch, not just a paper spec: window.__onRewardAdResult__
// is called by the native bridge as a plain function call, not a React SyntheticEvent, so it
// doesn't get React's synchronous "discrete event" flush treatment. The original source used
// `let committed = null; setG(updater); if (committed) flushSaveRun(committed);` for the
// "dew"/"revive" branches, assuming the updater always runs synchronously before the `if`
// check — it does NOT for a non-SyntheticEvent-triggered update, so `committed` stayed null
// and flushSaveRun was silently skipped: the reward showed up live on screen but was never
// saved, so a task-kill right after claiming it would lose it entirely. Fixed by reading
// gRef.current synchronously and using a plain-value setG (same pattern as useItem/equipItem).
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
    // A rare enemy at 1 HP: one attack kills it, dropping a dew consumable and triggering the
    // dewAdOffer overlay (battleWon() only sets dewAdOffer when a rare enemy's drops include dew).
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
  const offerShown = d.text().includes('宝 樹 の 雫');
  console.log('[1] dew-ad offer shown after killing the rare enemy:', offerShown);

  const adBtn = d.findButtonContaining('広 告 を 見 る');
  console.log('[2] ad button found:', !!adBtn);
  await d.click(adBtn);

  // Simulate the native ad SDK's rewarded callback (window.__onRewardAdResult__ is what the
  // real bridge calls). We never click "拾う" or "先へ進む" before checking storage below —
  // the save must happen as PART OF handling the ad result, not only on a later pickup/advance.
  await act(async () => { d.env.window.__onRewardAdResult__('dew', 'rewarded'); });
  await d.flush();

  const run = d.readJSON(RUN_SAVE_KEY);
  const dewInInv = (run.inv || []).some((i) => i.itemId === 'dew');
  const dewInDrops = (run.drops || []).some((i) => i.itemId === 'dew');
  console.log('[3] dew persisted immediately (inv):', dewInInv, '/ (drops, if bag was full):', dewInDrops);

  const pass = offerShown && !!adBtn && (dewInInv || dewInDrops);
  console.log(pass ? 'PASS' : 'FAIL: dew ad reward not durably saved before pickup');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
