// BTL-04 / BTL-05: regression guards for the A-1 fix. Elemental skill effects
// (lifestealPct / elementDmgPct) must only apply to a weapon whose dmgType matches the
// skill's `effect.element` — never leak onto every weapon regardless of element.
// Math.random is stubbed to 0.5 during each attack so rnd(0.9,1.1) resolves to exactly 1.0
// and dagger's 25% crit roll never fires, making every damage number exact and deterministic.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun(weapon, enemyHp = 500000) {
  return {
    floor: 1, node: 0,
    player: { hp: 50, poison: 0, atkUp: 0, guard: false },
    weapons: [weapon],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'e1', bookId: 'slime', name: '森スライム', asset: 'slime', hp: enemyHp, maxHp: enemyHp,
      atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
  };
}

async function attackOnceDeterministic(d, weaponName) {
  const origRandom = Math.random;
  Math.random = () => 0.5;
  try {
    await d.click(d.findButtonContaining(weaponName));
    await d.flushUntil(() => d.readJSON(RUN_SAVE_KEY).enemies?.[0]?.hp !== undefined && d.readJSON(RUN_SAVE_KEY).player.hp !== 50, { tries: 60 });
  } finally {
    Math.random = origRandom;
  }
}

// BTL-04: "音の余韻"(soundEdge, lifesteal 4%) must heal only when attacking with the
// instrument (音) weapon, not with an unrelated (斬) dagger.
async function testLifestealElementFilter() {
  const instrumentWeapon = { id: 'w1', kind: 'weapon', type: 'instrument', name: '試験の楽器', rarity: 'common', atk: 100, asset: 'instrument' };
  const d1 = makeDriver();
  d1.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: { soundBasics: true, soundEdge: true } });
  d1.seed(RUN_SAVE_KEY, mkRun(instrumentWeapon));
  await d1.mount();
  await d1.click('再開');
  await d1.flush();
  await attackOnceDeterministic(d1, '試験の楽器');
  const hpWithMatchingElement = d1.readJSON(RUN_SAVE_KEY).player.hp;
  // dmg dealt = 100 (raw*mult*aff*rnd(1.0)), heal = round(100*0.04) = 4, enemy counter = 1 (atk:0 floors to 1).
  console.log('[BTL-04a] instrument (音) attack with soundEdge learned -> HP (expect 53, healed):', hpWithMatchingElement);

  const daggerWeapon = { id: 'w2', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 100, asset: 'dagger' };
  const d2 = makeDriver();
  d2.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: { soundBasics: true, soundEdge: true } });
  d2.seed(RUN_SAVE_KEY, mkRun(daggerWeapon));
  await d2.mount();
  await d2.click('再開');
  await d2.flush();
  await attackOnceDeterministic(d2, '試験の短剣');
  const hpWithMismatchedElement = d2.readJSON(RUN_SAVE_KEY).player.hp;
  // Same soundEdge skill, but a 斬 weapon -> no lifesteal at all, only the -1 counter applies.
  console.log('[BTL-04b] dagger (斬) attack with soundEdge learned -> HP (expect 49, NOT healed):', hpWithMismatchedElement);

  return hpWithMatchingElement === 53 && hpWithMismatchedElement === 49;
}

// BTL-05: "斬の極意"(bladeMastery, +15% 斬 dmg on top of bladeBasics' +5%) must not inflate
// damage dealt with an unrelated (魔) book.
async function testElementDmgPctFilter() {
  const bookWeapon = { id: 'w1', kind: 'weapon', type: 'book', name: '試験の魔導書', rarity: 'common', atk: 100, asset: 'book' };
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: { bladeBasics: true, bladeMastery: true } });
  d.seed(RUN_SAVE_KEY, mkRun(bookWeapon, 500000));
  await d.mount();
  await d.click('再開');
  await d.flush();
  const before = d.readJSON(RUN_SAVE_KEY).enemies[0].hp;
  await attackOnceDeterministic(d, '試験の魔導書');
  const after = d.readJSON(RUN_SAVE_KEY).enemies[0].hp;
  const dmg = before - after;
  // Correct (filtered): dmg = round(100*1.0*1*1.0) = 100. Leaked (bug): 100*1.20 = 120.
  console.log('[BTL-05] book (魔) attack with bladeMastery(斬-only) learned -> dmg dealt (expect exactly 100, not 120):', dmg);
  return dmg === 100;
}

async function main() {
  const a = await testLifestealElementFilter();
  const b = await testElementDmgPctFilter();
  console.log(a ? 'PASS: lifestealPct only applies to the matching element' : 'FAIL: lifestealPct leaked to an unrelated weapon');
  console.log(b ? 'PASS: elementDmgPct only applies to the matching element' : 'FAIL: elementDmgPct leaked to an unrelated weapon');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
