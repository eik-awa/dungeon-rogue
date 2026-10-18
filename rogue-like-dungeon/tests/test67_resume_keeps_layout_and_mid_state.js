// Resume must not re-roll the floor layout (宝箱/泉 used to be re-drawn on every resume, so a chest
// could be opened again and again, a spring drunk again and again), and an opened chest / drunk spring
// (including the uncollected item) must come back exactly as it was left. Opening / drinking is also
// saved immediately.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const sword = { id: 'chestSword', kind: 'weapon', type: 'greatsword', name: '宝箱の大剣', rarity: 'rare', atk: 40, asset: 'greatsword' };
const mkRun = (extra = {}) => ({
  floor: 1, node: 1,
  player: { hp: 30, poison: 0, atkUp: 0, guard: false },
  weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
  armor: { helm: null, armor: null, charm: null }, inv: [],
  cds: {}, lastRareSeen: 0, orbBagBonus: 0, ...extra,
});

async function resume(run, mathRandom = 0.99) {
  Math.random = () => mathRandom; // a re-roll would give "battle" for the middle node
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.click('再開');
  await d.flush();
  return d;
}

async function main() {
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // [A] unopened chest with a saved layout survives resume (no re-roll into a battle)
  {
    const d = await resume(mkRun({ nodes: ['battle', 'chest', 'battle'], midPhase: 'chest', eventDone: false, midDrops: [] }));
    const saved = d.readJSON(RUN_SAVE_KEY);
    check('unopened chest is restored as a chest', !!d.findButtonContaining('開ける'));
    check('saved layout is kept', JSON.stringify(saved.nodes) === JSON.stringify(['battle', 'chest', 'battle']) && saved.midPhase === 'chest', saved.nodes);
  }

  // [B] opened chest: the uncollected item comes back, the chest cannot be opened again
  {
    const d = await resume(mkRun({ nodes: ['battle', 'chest', 'battle'], midPhase: 'chest', eventDone: true, midDrops: [sword] }));
    check('opened chest cannot be opened again', !d.findButtonContaining('開ける'));
    check('the uncollected item is still there', d.text().includes('宝箱の大剣') && !!d.findButtonContaining('拾う'));
  }

  // [C] drunk spring cannot be drunk again
  {
    const d = await resume(mkRun({ nodes: ['battle', 'spring', 'battle'], midPhase: 'spring', eventDone: true, midDrops: [] }));
    check('drunk spring cannot be drunk again', !d.findButtonContaining('飲む'));
  }

  // [D] legacy run (no layout / mid-state saved) still resumes without crashing and gets a layout saved
  {
    const d = await resume(mkRun({ node: 0, enemies: [{ id: 'e1', bookId: 'slime', name: '森スライム', asset: 'slime', hp: 20, maxHp: 20, atk: 1, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }] }));
    const saved = d.readJSON(RUN_SAVE_KEY);
    check('legacy save resumes in battle and now stores a layout', !!d.findButtonContaining('試験の短剣') && Array.isArray(saved.nodes) && saved.nodes.length === 3, saved.nodes);
  }

  // [E] opening a chest / drinking a spring is saved immediately (no loss on kill, no second use after resume)
  {
    const d = await resume(mkRun({ nodes: ['battle', 'chest', 'battle'], midPhase: 'chest', eventDone: false, midDrops: [] }), 0.1);
    await d.click('開ける');
    await d.flush();
    const saved = d.readJSON(RUN_SAVE_KEY);
    check('opening the chest saves the item and the opened flag at once', saved.midPhase === 'chest' && saved.eventDone === true && (saved.midDrops || []).length === 1, [saved.eventDone, (saved.midDrops || []).length]);
  }
  {
    const d = await resume(mkRun({ nodes: ['battle', 'spring', 'battle'], midPhase: 'spring', eventDone: false, midDrops: [] }), 0.9);
    const hpBefore = d.readJSON(RUN_SAVE_KEY).player.hp;
    await d.click('飲む');
    await d.flush();
    const saved = d.readJSON(RUN_SAVE_KEY);
    check('drinking the spring saves the heal and the drunk flag at once', saved.eventDone === true && saved.player.hp > hpBefore, [hpBefore, saved.player.hp, saved.eventDone]);
  }

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
