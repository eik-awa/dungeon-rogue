// Scenario (duplication / silent-loss check): resolveOrbChoice() gated its guard
// ("has this dew's choice already been resolved?") with a synchronous read of
// gRef.current.orbChoice, then applied via setG(plainObject) / setMeta(plainObject) — not
// functional updaters. Tapping BOTH choice buttons ("継承枠 +1" and "精の結晶 +1") near-
// simultaneously meant both calls saw orbChoice still true and both passed the guard; the
// second setMeta call then silently overwrote the first's reward. Depending on order this
// could look like either reward being lost, or (if the two setG calls raced differently)
// could leave the UI in an inconsistent state. Fixed by moving guard+apply into a single
// setG(updater), gating the setMeta call on whether that updater actually applied.
// After the fix, racing both buttons must grant EXACTLY ONE of the two rewards (never both,
// never neither) and must not throw.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function dewRun() {
  return {
    floor: 10, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w1', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [{ id: 'dew1', kind: 'item', itemId: 'dew', name: '宝樹の雫', rarity: 'legend', asset: 'dew' }],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    rewardPhase: 'clear', drops: [],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, dewBank: 0 });
  d.seed(RUN_SAVE_KEY, dewRun());
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click('袋を整理');
  await d.flush();
  await d.click(d.findButtonContaining('使う'));
  await d.flush();

  const slotBtn = d.findButtonContaining('継承枠 +1');
  const crystalBtn = d.findButtonContaining('精の結晶 +1');
  await d.raceClicks(slotBtn, crystalBtn);
  await d.flush(100);

  const meta = d.readJSON(SAVE_KEY);
  const slotGained = (meta.slots || 0) - 1; // started at 1
  const crystalGained = meta.dewBank || 0;
  console.log('slots gained (expect 0 or 1):', slotGained, '/ dewBank gained (expect 0 or 1):', crystalGained);
  const exactlyOne = (slotGained + crystalGained) === 1;
  console.log(exactlyOne ? 'PASS: exactly one reward applied' : 'FAIL: both or neither reward applied');
  process.exit(exactlyOne ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
