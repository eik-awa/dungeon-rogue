// New high-cost skills: 怯みの旋律 (instrument attack-down lasts 3 turns instead of 2) and
// 果てなき鞄 (bag capacity 24 -> 30). Both cost 25, more than any existing skill (max was 20).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 0, player: { hp: 200, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'instrument', name: '試験の笛', rarity: 'common', atk: 10, asset: 'instrument' }],
    armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'e1', bookId: 'x', name: '敵イチ', hp: 900, maxHp: 900, atk: 3, def: 0, weak: [], resist: [], asset: 'slime', atkDown: 0 }],
  };
}

async function debuffTurns(skills) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills, everHadWeapon: true });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush(600);
  // Read the debuff right after our attack (before the enemy consumes a turn of it).
  await d.click(d.findButtonContaining('試験の笛'));
  await d.flush(800);
  const e = d.readJSON(RUN_SAVE_KEY).enemies[0];
  // The enemy acts once after our attack and consumes one point of atkDown.
  return e.atkDown;
}

async function main() {
  const base = await debuffTurns({});
  const daze = await debuffTurns({ soundDaze: true });
  console.log('[1] instrument debuff without the skill lasts one more enemy action than with 2 turns:', base, '-> with skill:', daze);

  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'rogue-like-dungeon', 'kiriwatari-no-mori.jsx'), 'utf8');
  const cost = (id) => Number(new RegExp('id: "' + id + '"[^}]*?cost: (\\d+)').exec(src)[1]);
  const costs = [cost('soundDaze'), cost('bagCapIII')];
  console.log('[2] both new skills cost more than the previous max (powerSeal 20):', costs);
  const pass = daze === base + 1 && costs.every((c) => c > 20);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
