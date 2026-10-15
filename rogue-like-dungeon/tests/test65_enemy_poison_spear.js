// Feature (user-requested): only the spear poisons enemies (the bow does not).
//   - spear: poisons only the aimed enemy (no pierce any more), 2 turns, tick = round(raw * 0.30)
//   - the tick ignores enemy defense, applies at the end of the enemy phase, and re-applying
//     refreshes the duration without stacking the damage
//   - skills: 毒塗り +1 turn (3 = cap), 猛毒の極意 30% -> 40%, 毒牙の真髄 40% -> 50% (cap)
//   - the attack-up buff (atkUp) does not raise the poison damage
//   - bosses resist poison: the rate is 10 points lower (30/40/50% -> 20/30/40%)
//   - a poison kill of the last enemy ends the battle (no softlock)
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const enemy = (id, extra = {}) => ({
  id, bookId: 'slime', name: id, asset: 'slime', hp: 5000, maxHp: 5000, atk: 0, def: 10,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false, ...extra,
});
const weapon = (id, type, atk) => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'common', atk, asset: type });
const mkRun = (weapons, enemies, playerExtra = {}) => ({
  floor: 1, node: 0,
  player: { hp: 600, poison: 0, atkUp: 0, guard: false, ...playerExtra },
  weapons,
  armor: { helm: null, armor: null, charm: null }, inv: [],
  cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies,
});

async function start(meta, run) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, ...meta });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.click('再開');
  await d.flush();
  return d;
}
// Attack once with the named weapon (clicking an enemy card when a target must be chosen),
// then wait until the end-of-turn save (turn counter advances / reward screen / enemy damaged).
async function attackOnce(d, weaponName, targetName) {
  const turnBefore = d.readJSON(RUN_SAVE_KEY).turn;
  await d.click(weaponName);
  await d.flush();
  if (targetName) {
    const card = Array.from(d.container.querySelectorAll('.kw-enemy')).find((el) => el.textContent.includes(targetName));
    await d.click(card);
  }
  await d.flushUntil(() => {
    const r = d.readJSON(RUN_SAVE_KEY);
    return !r || r.rewardPhase || (r.turn || 1) !== (turnBefore || 1);
  }, { tries: 80 });
  await d.flush(); await d.flush();
  return d.readJSON(RUN_SAVE_KEY);
}

async function main() {
  Math.random = () => 0.5; // rnd(0.9,1.1) -> 1.0 exactly
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // [A] spear (no pierce): aimed A hit = round(22)-10 = 12, tick = round(20*0.30) = 6; B is untouched
  {
    const d = await start({}, mkRun([weapon('槍', 'spear', 20)], [enemy('A'), enemy('B')]));
    const run = await attackOnce(d, '試験の槍', 'A');
    const a = run.enemies.find((x) => x.id === 'A'); const b = run.enemies.find((x) => x.id === 'B');
    check('spear: aimed enemy poisoned (1 turn left after the first tick, tick 6)', a.poisonT === 1 && a.poisonDmg === 6, [a.poisonT, a.poisonDmg]);
    check('spear: A hp = 5000 - 12 (hit) - 6 (tick, ignores def)', a.hp === 4982, a.hp);
    check('spear: NO pierce, the enemy behind is untouched and unpoisoned', b.hp === 5000 && !(b.poisonT > 0), [b.hp, b.poisonT]);
  }

  // [B] re-applying (second spear, since the first is on cooldown) refreshes the duration, never stacks the damage
  {
    const d = await start({}, mkRun([weapon('槍1', 'spear', 20), weapon('槍2', 'spear', 20)], [enemy('A')]));
    await attackOnce(d, '試験の槍1');
    const run = await attackOnce(d, '試験の槍2');
    const e = run.enemies[0];
    check('re-apply: duration refreshed (1 left), tick not stacked (6)', e.poisonT === 1 && e.poisonDmg === 6, [e.poisonT, e.poisonDmg]);
    check('re-apply: two turns of hit(12)+tick(6) = 5000-36', e.hp === 4964, e.hp);
  }

  // [C] the bow never poisons
  {
    const d = await start({}, mkRun([weapon('弓', 'bow', 20)], [enemy('A'), enemy('B')]));
    const run = await attackOnce(d, '試験の弓', 'A');
    const poisoned = run.enemies.some((x) => x.poisonT > 0 || x.poisonDmg > 0);
    check('bow: no enemy is poisoned', !poisoned, run.enemies.map((x) => [x.id, x.poisonT, x.poisonDmg]));
    check('bow: still hits normally (A took 10)', run.enemies.find((x) => x.id === 'A').hp === 4990, run.enemies.find((x) => x.id === 'A').hp);
  }

  // [D] skill tiers (raw=100): none 30% -> 30, 猛毒の極意 40% -> 40, + 毒牙の真髄 50% (the cap) -> 50;
  //      毒塗りの心得 extends 2 -> 3 turns (the cap), so 2 are left after the first tick
  {
    const tiers = [
      ['no skills', {}, 30, 1],
      ['猛毒の極意', { pierceVenomMastery: true }, 40, 1],
      ['極意 + 毒牙の真髄', { pierceVenomMastery: true, pierceVenomDeep: true }, 50, 1],
      ['all skills (turns cap 3)', { pierceVenom: true, pierceVenomMastery: true, pierceVenomDeep: true }, 50, 2],
    ];
    for (const [label, skills, tick, left] of tiers) {
      const d = await start({ skills }, mkRun([weapon('槍', 'spear', 100)], [enemy('A')]));
      const run = await attackOnce(d, '試験の槍');
      const e = run.enemies[0];
      check(`skills [${label}]: tick ${tick}, ${left} turn(s) left after the first tick`, e.poisonDmg === tick && e.poisonT === left, [e.poisonDmg, e.poisonT]);
    }
  }

  // [E] attack-up buff raises the hit but never the poison tick (atk 20, buff x1.4: hit round(28*1.1)=31-10=21, tick still 6)
  {
    const d = await start({}, mkRun([weapon('槍', 'spear', 20)], [enemy('A')], { atkUp: 3 }));
    const run = await attackOnce(d, '試験の槍');
    const e = run.enemies[0];
    check('buff: hit is boosted (5000 - 21 - 6)', e.hp === 4973, e.hp);
    check('buff: poison tick is NOT boosted (6)', e.poisonDmg === 6, e.poisonDmg);
  }

  // [F] bosses resist poison: rate is 10 points lower. raw=200: 20% -> 40, +極意 30% -> 60, +真髄 40% -> 80
  //     (normal enemies would take 60 / 80 / 100); duration unchanged
  {
    const tiers = [['no skills', {}, 40], ['猛毒の極意', { pierceVenomMastery: true }, 60], ['極意 + 毒牙の真髄', { pierceVenomMastery: true, pierceVenomDeep: true }, 80]];
    for (const [label, skills, tick] of tiers) {
      const boss = enemy('Boss', { boss: true, hp: 50000, maxHp: 50000, summons: ['slime'], chargeLine: '', bigLine: '', summonLine: '' });
      const d = await start({ skills }, mkRun([weapon('槍', 'spear', 200)], [boss]));
      const run = await attackOnce(d, '試験の槍');
      const e = run.enemies[0];
      check(`boss [${label}]: tick ${tick}, duration unchanged (1 left)`, e.poisonDmg === tick && e.poisonT === 1, [e.poisonDmg, e.poisonT]);
    }
  }

  // [G] poison finishes the last enemy: hit 12 leaves 3 hp, tick 6 kills -> reward screen
  {
    const d = await start({}, mkRun([weapon('槍', 'spear', 20)], [enemy('A', { hp: 15, maxHp: 15 })]));
    const run = await attackOnce(d, '試験の槍');
    check('poison kill of the last enemy ends the battle', run && run.rewardPhase === 'reward', run && run.rewardPhase);
  }

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
