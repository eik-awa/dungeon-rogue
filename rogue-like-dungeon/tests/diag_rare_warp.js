const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun(floor, lastRareSeen) {
  return {
    floor, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: 'w', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen, orbBagBonus: 0,
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 3, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun(1, 0));
  await d.mount();
  await d.click('再開');
  await d.flush();

  for (let i = 0; i < 8; i++) {
    const targetChapterName = (i % 2 === 0) ? '茸の湿原' : '霧渡りの森'; // ch2 <-> ch1
    // Interrupt to title first (章を選ぶ only lives on the title screen)
    await d.click('タイトルへ');
    await d.flush();
    await d.click('中断してタイトルへ');
    await d.flush();
    await d.click('章を選ぶ');
    await d.flush();
    const btn = d.findButtonContaining(targetChapterName);
    if (!btn) { console.log('no button for', targetChapterName, 'at iter', i, d.text().replace(/\s+/g,' ').slice(-300)); break; }
    await d.click(btn);
    await d.flush();
    const run = d.readJSON(RUN_SAVE_KEY);
    const gap = run.floor - run.lastRareSeen;
    console.log(`iter ${i}: floor=${run.floor} lastRareSeen=${run.lastRareSeen} gap=${gap}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
