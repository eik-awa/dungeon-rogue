// PROG-06: the boss-only "苔の心臓" (mossHeart, permanent +6 maxHp) drop must only ever be
// granted once per chapter — meta.mossHeartStages records which chapter indices already paid
// out, and rollDrops()/battleWon() check/update it. This locks that in: defeating the SAME
// chapter's boss a second time (after mossHeartStages already records it) must not drop
// another one.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkBossRun() {
  return {
    floor: 10, node: 0, // chapter 1's boss floor (stageOf(10) === 0)
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 50, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'bossCh1', bookId: 'bossDeer', name: '森の主・苔冠の大鹿', asset: 'bossDeer', hp: 1, maxHp: 1000,
      atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: true,
      summons: ['slime'], chargeLine: 'x', bigLine: 'y', summonLine: 'z' }],
  };
}

async function killBossAndCheckDrops(mossHeartStages) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, mossHeartStages });
  d.seed(RUN_SAVE_KEY, mkBossRun());
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click(d.findButtonContaining('試験の短剣'));
  await d.flushUntil(() => d.text().includes('章 ク リ ア') || d.text().includes('勝 利') || d.text().includes('クリア'), { tries: 80 });
  const gotMossHeart = d.text().includes('苔の心臓');
  const meta = d.readJSON(SAVE_KEY);
  return { gotMossHeart, mossHeartStagesAfter: meta.mossHeartStages };
}

async function main() {
  const first = await killBossAndCheckDrops([]); // first kill: chapter 1 not yet recorded
  console.log('[1] first kill of chapter-1 boss grants mossHeart:', first.gotMossHeart, '| stages after:', JSON.stringify(first.mossHeartStagesAfter));

  const second = await killBossAndCheckDrops([0]); // second kill: chapter index 0 already recorded
  console.log('[2] second kill of the SAME chapter boss does NOT grant mossHeart again:', !second.gotMossHeart);

  const pass = first.gotMossHeart && first.mossHeartStagesAfter.includes(0) && !second.gotMossHeart;
  console.log(pass ? 'PASS' : 'FAIL: mossHeart was granted more than once for the same chapter');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
