// Scenario (the original reported bug): warping to a different, already-cleared chapter via
// title -> "章を選ぶ" while a LIVE (paused, not dead) run exists must NOT reset items to
// starter gear. It must preserve weapons/armor/inv/HP and just move the floor.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkWeapon(atk, extra = {}) {
  return { id: 'w' + atk, kind: 'weapon', type: 'greatsword', name: 'とても強い大剣', rarity: 'legend', atk, asset: 'greatsword', ...extra };
}
function mkItem(itemId, extra = {}) {
  return { id: 'i-' + itemId, kind: 'item', itemId, name: itemId, rarity: 'common', asset: itemId, ...extra };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 3 }); // chapters 1-3 clear-selectable
  // Alive/paused run mid-way through chapter 3 (floor 21), carrying a distinctive high-atk
  // weapon and a consumable, with less-than-full HP.
  d.seed(RUN_SAVE_KEY, {
    floor: 21, node: 0,
    player: { hp: 37, poison: 0, atkUp: 0, guard: false },
    weapons: [mkWeapon(999, { locked: true })],
    armor: { helm: null, armor: null, charm: null },
    inv: [mkItem('berrySmall')],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  });

  await d.mount();
  await d.click('章を選ぶ');
  await d.flush();
  console.log('[1] chapterSelect notes item preservation for a live run:',
    d.text().includes('所持品とHPを保ったまま'));

  const ch1Btn = d.findButtonContaining('第1章');
  await d.click(ch1Btn);
  await d.flush(100);

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[2] resulting floor (expect 1 = chapter 1 start):', run.floor);
  console.log('[3] player HP preserved (expect 37):', run.player.hp);
  const gotWeapon999 = (run.weapons || []).some((w) => w && w.atk === 999);
  const gotBerry = (run.inv || []).some((it) => it.itemId === 'berrySmall');
  console.log('[4] carried the 999-atk weapon (not reset to starter dagger):', gotWeapon999);
  console.log('[5] carried the berrySmall consumable:', gotBerry);

  const pass = run.floor === 1 && run.player.hp === 37 && gotWeapon999 && gotBerry;
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
