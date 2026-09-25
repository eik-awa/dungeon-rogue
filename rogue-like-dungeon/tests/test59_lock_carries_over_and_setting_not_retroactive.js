// Feature (user-requested): locks persist so the player doesn't re-lock every run.
//   - Inherited items keep their lock state across death/rebirth.
//   - Toggling a protect setting OFF leaves already-locked items locked, and never locks
//     items that were unlocked (settings only affect items obtained afterwards).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

async function main() {
  Math.random = () => 0.1;
  const d = makeDriver();
  d.seed(SAVE_KEY, {
    slots: 2, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true, protectRareItems: false,
    inherited: [
      { id: 'iw1', kind: 'weapon', type: 'greatsword', name: '継承の大剣', rarity: 'rare', atk: 50, asset: 'greatsword', locked: true },
      { id: 'iw2', kind: 'item', itemId: 'berryBig', name: '生命の果実', rarity: 'common', asset: 'berryBig', locked: false },
    ],
  });
  await d.mount();
  await d.click('森 へ 入 る');
  await d.flush();
  await d.click('踏 み 入 れ る');
  await d.flush();
  const run = d.readJSON(RUN_SAVE_KEY);
  const all = [...(run.weapons || []).filter(Boolean), ...(run.inv || [])];
  const sword = all.find((x) => x.name === '継承の大剣');
  const fruit = all.find((x) => x.name === '生命の果実');
  console.log('[1] inherited locked item is still locked:', !!sword && sword.locked === true);
  console.log('[2] inherited unlocked item stays unlocked:', !!fruit && fruit.locked !== true);
  const pass = !!sword && sword.locked === true && !!fruit && fruit.locked !== true;
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
