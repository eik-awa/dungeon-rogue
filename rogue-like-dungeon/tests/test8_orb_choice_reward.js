// Scenario (real bug reported by a player): using the "宝樹の雫" (dew) item and choosing
// either "継承枠 +1" or "精の結晶 +1" must actually grant that reward. This previously failed
// SILENTLY on every single normal tap (not just under rapid double-tapping): resolveOrbChoice()
// gated the meta.slots/dewBank update behind a `committed` variable that was supposed to be set
// synchronously inside setG's updater callback, but React 18 does not guarantee that — so the
// dew was consumed and the UI closed normally, while the actual reward was silently skipped.
// eventConvert() (the daily-shrine version of the same choice) had the identical bug and was
// fixed the same way, but is not separately covered here due to date-gated setup complexity.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function dewRun(extraInv = []) {
  return {
    floor: 10, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w1', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [{ id: 'dew1', kind: 'item', itemId: 'dew', name: '宝樹の雫', rarity: 'legend', asset: 'dew' }, ...extraInv],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    rewardPhase: 'clear', drops: [],
  };
}

async function testCrystal() {
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
  console.log('[crystal] orb choice screen shown:', d.text().includes('使いみちを選んでください'));
  await d.click('精の結晶 +1');
  await d.flush(100);
  const meta = d.readJSON(SAVE_KEY);
  console.log('[crystal] meta.dewBank (expect 1):', meta.dewBank);
  return meta.dewBank === 1;
}

async function testSlot() {
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
  await d.click('継承枠 +1');
  await d.flush(100);
  const meta = d.readJSON(SAVE_KEY);
  console.log('[slot] meta.slots (expect 2):', meta.slots);
  return meta.slots === 2;
}

async function main() {
  const a = await testCrystal();
  const b = await testSlot();
  console.log(a ? 'PASS: crystal choice grants dewBank' : 'FAIL: crystal choice granted nothing');
  console.log(b ? 'PASS: slot choice grants +1 slot' : 'FAIL: slot choice granted nothing');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
