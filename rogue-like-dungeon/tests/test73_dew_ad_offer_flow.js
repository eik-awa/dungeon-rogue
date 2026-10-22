// Dew-doubling ad offer (reward screen after catching the golden spirit):
//  - the offer stays open with a loading state while the ad request is in flight (it used to vanish at the tap,
//    so it looked as if the ad had already been watched), and can't be dismissed / re-requested mid-request
//  - a failed request closes the offer and leaves the retry button; the failure consumes no daily use
//  - a rewarded result adds exactly one dew and consumes exactly one use
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const spirit = { id: 'gold1', bookId: 'goldSprite', name: '金枝の精', asset: 'goldSprite', hp: 1, maxHp: 1, atk: 2, def: 0,
  weak: [], resist: [], rare: true, fleeIn: 3, atkDown: 0, boss: false };
const run = {
  floor: 1, node: 0, nodes: ['battle', 'battle', 'battle'],
  player: { hp: 60, poison: 0, atkUp: 0, guard: false },
  weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 50, asset: 'dagger' }],
  armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies: [spirit],
};

async function toOffer() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click(d.findButtonContaining('試験の短剣'));
  await d.flushUntil(() => d.text().includes('雫をもう1個もらえます'), { tries: 80 });
  return d;
}
const result = (d, ctx, r) => act(async () => { d.env.window.__onRewardAdResult__(ctx, r); });

async function main() {
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  const d = await toOffer();
  check('offer is shown with the shared daily count', d.text().includes('雫をもう1個もらえます') && d.text().includes('本日あと5回'));

  await d.click('広 告 を 見 る');
  await d.flush();
  check('offer stays open and shows the loading state', d.text().includes('雫をもう1個もらえます') && d.text().includes('読み込み中'));
  check('"いいえ" and the button are disabled while loading', !d.findButtonContaining('いいえ') && !d.findButtonContaining('読み込み中'));

  await result(d, 'dew', 'nofill');
  await d.flush();
  check('a failed request closes the offer', !d.text().includes('雫をもう1個もらえます'));
  check('retry button is available and no use was consumed', !!d.findButtonContaining('広告を再試行して雫を2倍にする') && !(d.readJSON(SAVE_KEY).rewardAd && d.readJSON(SAVE_KEY).rewardAd.count));

  await d.click('広告を再試行して雫を2倍にする');
  await d.flush();
  await result(d, 'dew', 'rewarded');
  await d.flush();
  const saved = d.readJSON(RUN_SAVE_KEY);
  const meta = d.readJSON(SAVE_KEY);
  const dewCount = [...(saved.inv || []), ...(saved.drops || [])].filter((x) => x.itemId === 'dew').length;
  check('rewarded: exactly one extra dew (the spirit\'s own + one = 2)', dewCount === 2, dewCount);
  check('rewarded: exactly one daily use consumed', meta.rewardAd && meta.rewardAd.count === 1, meta.rewardAd);
  check('rewarded: the offer is gone', !d.text().includes('雫をもう1個もらえます'));

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
