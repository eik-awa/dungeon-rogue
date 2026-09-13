// Scenario (amplification check): double-clicking the "放棄する" confirm button (which runs
// autoCarryOverFromDeadRun() + clearRun()) must not double-apply — dewBank and the inherited
// list must reflect exactly one application, not two.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkWeapon(atk) {
  return { id: 'w' + atk, kind: 'weapon', type: 'dagger', name: 'w' + atk, rarity: 'common', atk, asset: 'dagger' };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 2, checkpoint: 1, dewBank: 0 });
  d.seed(RUN_SAVE_KEY, {
    phase: 'dead', floor: 1,
    weapons: [mkWeapon(10), mkWeapon(20)],
    armor: { helm: null, armor: null, charm: null },
    inv: [{ id: 'dew1', kind: 'item', itemId: 'dew', name: 'dew', rarity: 'legend', asset: 'dew' }],
    orbBagBonus: 0, orbSlotBonus: 0,
  });
  await d.mount();
  await d.click('放棄');
  await d.flush();

  const confirmBtn = d.findButtonContaining('放棄する');
  await d.doubleClickRace(confirmBtn);
  await d.flush(100);

  const meta = d.readJSON(SAVE_KEY);
  // Note: the dew item's itemScore legitimately outranks both weapons and claims one of the 2
  // slots itself before being converted to a crystal, leaving room only for the better weapon
  // (atk 20) — that's correct pre-existing scoring behavior, not a bug. What's under test here
  // is duplication: dewBank must be exactly 1 (not 2), and the weapon must not appear twice.
  const w20Count = (meta.inherited || []).filter((x) => x.atk === 20).length;
  console.log('dewBank after double-click (expect exactly 1, not 2):', meta.dewBank);
  console.log('w20 count in inherited (expect exactly 1, not 2):', w20Count);
  const pass = meta.dewBank === 1 && w20Count === 1 && (meta.inherited || []).length === 1;
  console.log(pass ? 'PASS' : 'FAIL: possible duplication');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
