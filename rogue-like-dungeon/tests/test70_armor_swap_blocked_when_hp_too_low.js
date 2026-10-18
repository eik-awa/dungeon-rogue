// Taking off (or swapping to a lower-HP) armor at low HP used to clamp the player's HP to 1, and putting
// the armor back on added its full HP bonus again (HP 5 -> 61). Now the change is refused when it would
// drop HP below 1, with a message; changes that keep HP >= 1 still work symmetrically.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const heavy = { id: 'armorB', kind: 'armor', type: 'armor', slot: 'armor', name: '重装の鎧', rarity: 'rare', hp: 56, asset: 'armor' };
const light = { id: 'armorA', kind: 'armor', type: 'armor', slot: 'armor', name: '軽装の鎧', rarity: 'common', hp: 5, asset: 'armor' };
const mkRun = (hp, armor, inv) => ({
  floor: 1, node: 1, nodes: ['battle', 'chest', 'battle'], midPhase: 'chest', eventDone: false, midDrops: [],
  player: { hp, poison: 0, atkUp: 0, guard: false },
  weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 10, asset: 'dagger' }],
  armor: { helm: null, armor, charm: null }, inv,
  cds: {}, lastRareSeen: 0, orbBagBonus: 0,
});

async function bag(run) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click('袋');
  await d.flush();
  return d;
}

async function main() {
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // [A] low HP: swapping the heavy armor for the light one (-51 HP) is refused
  {
    const d = await bag(mkRun(5, heavy, [light]));
    await d.click(d.findButtonContaining('装備する'));
    await d.flush(50);
    const run = d.readJSON(RUN_SAVE_KEY);
    check('swap that would drop HP below 1 is refused (HP and armor unchanged)', run.player.hp === 5 && run.armor.armor.id === 'armorB', [run.player.hp, run.armor.armor.id]);
    check('a message explains why', d.text().includes('HPが足りないため'));
  }

  // [B] enough HP: the same swap works and is symmetric (60 - 51 = 9, and back to 60)
  {
    const d = await bag(mkRun(60, heavy, [light]));
    await d.click(d.findButtonContaining('装備する'));
    await d.flush(50);
    let run = d.readJSON(RUN_SAVE_KEY);
    check('swap with enough HP works (60 -> 9)', run.player.hp === 9 && run.armor.armor.id === 'armorA', [run.player.hp, run.armor.armor.id]);
    await d.click(d.findButtonContaining('装備する'));
    await d.flush(50);
    run = d.readJSON(RUN_SAVE_KEY);
    check('swapping back restores exactly (9 -> 60)', run.player.hp === 60 && run.armor.armor.id === 'armorB', [run.player.hp, run.armor.armor.id]);
  }

  // [C] low HP: taking the heavy armor off (no replacement) is refused too
  {
    const d = await bag(mkRun(5, heavy, []));
    const equippedCell = Array.from(d.container.querySelectorAll('*')).filter((el) => el.textContent.trim().startsWith('重装の鎧') || (el.getAttribute && el.getAttribute('role') === 'button' && el.textContent.includes('重装の鎧')));
    const target = equippedCell.reverse().find((el) => typeof el.click === 'function');
    if (target) { await d.click(target); await d.flush(50); }
    const run = d.readJSON(RUN_SAVE_KEY);
    check('taking the armor off at low HP is refused', !!target && run.player.hp === 5 && run.armor.armor && run.armor.armor.id === 'armorB', [!!target, run.player.hp, run.armor.armor && run.armor.armor.id]);
  }

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
