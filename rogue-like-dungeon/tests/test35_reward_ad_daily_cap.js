// AD-03: the reward-ad daily use cap (REWARD_AD_DAILY_LIMIT = 3) must actually block a 4th
// offer once exhausted for today, and must reset once the stored date no longer matches
// today's key (rewardAdTodayKey()). We don't mock Date (broad blast radius on the whole test
// env, including log/float timestamps) — instead we compute today's key with the exact same
// formula the app uses and seed meta.rewardAd directly at the boundary conditions.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function mkRareKillRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 50, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'rareA', bookId: 'wisp', name: '金枝の精', asset: 'wisp', hp: 1, maxHp: 1,
      atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: true, boss: false, fleeIn: 3 }],
  };
}

async function main() {
  // Case 1: already used all 3 today -> no offer.
  const d1 = makeDriver();
  d1.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, rewardAd: { date: todayKey(), count: 3 } });
  d1.seed(RUN_SAVE_KEY, mkRareKillRun());
  await d1.mount();
  await d1.click('再開');
  await d1.flush();
  await d1.click(d1.findButtonContaining('試験の短剣'));
  await d1.flushUntil(() => d1.text().includes('勝 利'), { tries: 60 });
  const offeredAfterCapUsed = d1.text().includes('宝 樹 の 雫');
  console.log('[1] no dew-ad offer after 3 daily uses already spent today:', !offeredAfterCapUsed);

  // Case 2: 3 uses recorded under a DIFFERENT (stale) date -> resets, offer appears again.
  const d2 = makeDriver();
  d2.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, rewardAd: { date: '2000-1-1', count: 3 } });
  d2.seed(RUN_SAVE_KEY, mkRareKillRun());
  await d2.mount();
  await d2.click('再開');
  await d2.flush();
  await d2.click(d2.findButtonContaining('試験の短剣'));
  await d2.flushUntil(() => d2.text().includes('勝 利'), { tries: 60 });
  const offeredAfterDateRollover = d2.text().includes('宝 樹 の 雫');
  console.log('[2] offer resets once the stored date no longer matches today:', offeredAfterDateRollover);

  const pass = !offeredAfterCapUsed && offeredAfterDateRollover;
  console.log(pass ? 'PASS' : 'FAIL: daily ad cap not enforced or not reset on date rollover');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
