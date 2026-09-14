// BTL-12: the busy-stuck watchdog (a 3000ms failsafe that force-clears g.busy if untouched —
// see the note in drive.js's flushUntil about it racing ahead under sped-up test timers) must
// not fire mid-turn and truncate a normal enemy turn early. With TWO enemies (so the turn
// takes two sequential setG steps ~380ms apart, each of which resets the watchdog's own timer
// per its `[g]` dependency), the final persisted HP must reflect damage from BOTH enemies —
// if the watchdog forced busy:false and the flow got cut short after only the first enemy
// acted, this would come up short.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'book', name: '試験の魔導書', rarity: 'common', atk: 10, asset: 'book' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [
      { id: 'e1', bookId: 'slime', name: '森スライムA', asset: 'slime', hp: 1000, maxHp: 1000,
        atk: 10, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false },
      { id: 'e2', bookId: 'slime', name: '森スライムB', asset: 'slime', hp: 1000, maxHp: 1000,
        atk: 15, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false },
    ],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  const startHp = d.readJSON(RUN_SAVE_KEY).player.hp;
  const origRandom = Math.random;
  Math.random = () => 0.5; // rnd(0.9,1.1) -> exactly 1.0, deterministic damage
  try {
    await d.click(d.findButtonContaining('試験の魔導書')); // book hits both enemies (AoE), doesn't kill either (hp:1000)
    await d.flushUntil(() => d.readJSON(RUN_SAVE_KEY).player.hp !== startHp, { tries: 80 });
  } finally {
    Math.random = origRandom;
  }

  const endHp = d.readJSON(RUN_SAVE_KEY).player.hp;
  const totalDmg = startHp - endHp;
  console.log('[1] player HP after both enemies acted (expect 72-25=47, i.e. BOTH enemies dealt damage):', endHp, '(dmg taken:', totalDmg, ')');

  const pass = totalDmg === 25;
  console.log(pass ? 'PASS' : 'FAIL: turn was cut short (watchdog likely truncated the multi-enemy turn)');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
