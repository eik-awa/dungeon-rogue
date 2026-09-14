// UI-02: the header's bag count display ("袋 (n/cap)") must match the actual stored data,
// both the numerator (inv.length) and the denominator (invCapOf(meta)).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun(count) {
  const inv = Array.from({ length: count }, (_, i) => ({
    id: `filler${i}`, kind: 'item', itemId: 'berrySmall', name: '木の実', rarity: 'common', asset: 'berry',
  }));
  return {
    floor: 1, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv,
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'e1', bookId: 'slime', name: '森スライム', asset: 'slime', hp: 1000, maxHp: 1000,
      atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
  };
}

async function main() {
  const d = makeDriver();
  // bagCapI (+5) learned -> invCapOf() = 14 + 5 = 19, distinct from the unmodified 14 default
  // so the test actually exercises the skill-aware cap computation, not just a hardcoded 14.
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: { bagCapI: true } });
  d.seed(RUN_SAVE_KEY, mkRun(6));
  await d.mount();
  await d.click('再開');
  await d.flush();

  const shown = d.text().includes('袋 (6/19)');
  console.log('[1] header shows "袋 (6/19)" matching inv.length and invCapOf(meta):', shown);

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[2] stored inv.length actually is 6:', run.inv.length === 6);

  const pass = shown && run.inv.length === 6;
  console.log(pass ? 'PASS' : 'FAIL: bag count display does not match stored data');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
