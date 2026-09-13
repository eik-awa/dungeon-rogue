// Scenario: on the death/rebirth screen, the player can pick which cleared chapter to
// respawn into, instead of always the deepest checkpoint.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkWeapon(atk, extra = {}) {
  return { id: 'w' + atk, kind: 'weapon', type: 'dagger', name: 'テスト短剣' + atk, rarity: 'common', atk, asset: 'dagger', ...extra };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 3, checkpoint: 5 }); // chapters 1..5 selectable at the rebirth screen
  d.seed(RUN_SAVE_KEY, {
    phase: 'dead', floor: 41,
    weapons: [mkWeapon(50)],
    armor: { helm: null, armor: null, charm: null },
    inv: [], orbBagBonus: 0, orbSlotBonus: 0,
  });

  await d.mount();
  await d.click('転生を選ぶ');
  await d.flush();
  console.log('[1] stage picker header present:', d.text().includes('再開する章を選ぶ'));

  const ch2Btn = d.findButtonContaining('第2章');
  console.log('[2] chapter-2 button found:', !!ch2Btn);
  await d.click(ch2Btn);
  await d.flush();

  const rebirthBtn = d.findButtonContaining('生まれ変わる');
  await d.click(rebirthBtn);
  await d.flush(100);

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[3] resulting floor (expect 11 = chapter 2 start):', run.floor);
  const pass = run.floor === 11;
  console.log(pass ? 'PASS' : 'FAIL: expected floor 11, got ' + run.floor);
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
