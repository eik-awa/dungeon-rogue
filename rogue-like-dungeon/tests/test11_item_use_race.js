// Scenario (silent-loss / amplification check): useItem() used to compute its state update
// (inventory removal, HP effects, meta bonusHp for 苔の心臓/mossHeart) from a synchronous
// gRef.current snapshot and then call setG(plainObject) / setMeta(plainObject) — NOT functional
// updaters. Tapping two DIFFERENT consumable items back-to-back, before React re-rendered,
// meant both calls read the same starting snapshot: the second setG/setMeta call fully
// overwrote the first, so only one of the two items' effects actually stuck even though both
// were removed from the visible bag / animated as "used". For a permanent-stat item like
// mossHeart (苔の心臓, +6 max HP forever) this meant a silently lost permanent bonus.
// Fixed by moving the guard+apply into a single setG(updater) (and meta bonusHp into a
// setMeta(updater)), so two near-simultaneous different-item uses now both apply in full.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mossHeartRun() {
  return {
    floor: 10, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w1', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [
      { id: 'mh1', kind: 'item', itemId: 'mossHeart', name: '苔の心臓', rarity: 'legend', asset: 'mossHeart' },
      { id: 'mh2', kind: 'item', itemId: 'mossHeart', name: '苔の心臓', rarity: 'legend', asset: 'mossHeart' },
    ],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    rewardPhase: 'clear', drops: [],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, dewBank: 0, bonusHp: 0 });
  d.seed(RUN_SAVE_KEY, mossHeartRun());
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click('袋を整理');
  await d.flush();

  const cells = d.findAllButtonsContaining('苔の心臓');
  if (cells.length < 2) throw new Error('expected 2 mossHeart cells, found ' + cells.length);
  await d.raceClicks(cells[0], cells[1]);
  await d.flush(500);

  const meta = d.readJSON(SAVE_KEY);
  console.log('bonusHp after racing 2 mossHeart uses (expect 12, not 6):', meta.bonusHp);
  const pass = meta.bonusHp === 12;
  console.log(pass ? 'PASS' : 'FAIL: one mossHeart use was silently lost');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
