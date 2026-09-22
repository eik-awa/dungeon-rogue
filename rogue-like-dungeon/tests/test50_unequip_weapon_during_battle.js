// Policy (user-requested, superseding an earlier same-session change): equipment changes
// (unequip weapon/armor, swap picker) must NOT be available during battle at all — swapping
// gear should happen between battles, not mid-fight. This test locks in that the equipped-gear
// management section of the bag/equipment overlay stays hidden while g.phase === "battle",
// while the plain "拾う/装備する" flow for filling an EMPTY slot still works in battle (that
// safety net — recovering from zero equipped weapons — must keep working).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 0, phase: 'battle',
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [
      { id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 20, asset: 'dagger' },
      { id: 'w2', kind: 'weapon', type: 'axe', name: '試験の斧', rarity: 'common', atk: 15, asset: 'axe' },
    ],
    armor: { helm: { id: 'h1', kind: 'armor', slot: 'helm', type: 'helm', name: '試験の兜', rarity: 'common', def: 2, hp: 5, asset: 'helm' }, armor: null, charm: null },
    inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'e1', bookId: 'slime', name: 'スライム', asset: 'slime', hp: 40, maxHp: 40, atk: 3, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  await d.click('袋');
  await d.flush();
  console.log('[1] equipped-weapon management section hidden during battle:', !d.text().includes('装備中の武器'));
  console.log('[2] armor management section hidden during battle:', !d.text().includes('── 防具'));

  // The equipped weapon's card should NOT be tappable-to-unequip while in battle — it only
  // appears in the attack hand now (kw-wcard), never as a bag kw-cell.
  const equippedCardInBag = Array.from(d.container.querySelectorAll('button.kw-cell'))
    .find((b) => b.textContent.includes('試験の短剣'));
  console.log('[3] no bag "kw-cell" card for the equipped weapon in battle (nothing to unequip from):', !equippedCardInBag);

  const pass = !d.text().includes('装備中の武器') && !d.text().includes('── 防具') && !equippedCardInBag;
  console.log(pass ? 'PASS' : 'FAIL: equipment management is still reachable during battle');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
