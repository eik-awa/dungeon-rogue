// Closing the app during the ad-revive offer used to save "HP 0, no enemies": resuming then started a
// fresh fight at HP 0, and healing items let the player dodge the death. Now the offer is saved at once
// (with the enemies) and restored on resume; with no ad left the resume goes straight to the death screen.
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const jstKey = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10).split('-').map(Number).join('-');
const enemy = { id: 'slimeA', bookId: 'slime', name: '森スライム', asset: 'slime', hp: 999999, maxHp: 999999,
  atk: 9999, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false };
const mkRun = (extra = {}) => ({
  floor: 1, node: 0,
  player: { hp: 72, poison: 0, atkUp: 0, guard: false },
  weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 1, asset: 'dagger' }],
  armor: { helm: null, armor: null, charm: null }, inv: [], nodes: ['battle', 'battle', 'battle'],
  cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies: [enemy], ...extra,
});

async function main() {
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // [A] dying shows the offer and saves it immediately (hp 0 + enemies + reviveOffer marker)
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click(d.findButtonContaining('試験の短剣'));
  await d.flushUntil(() => d.text().includes('力尽きかけている'), { tries: 80 });
  await d.flush(); await d.flush();
  const saved = d.readJSON(RUN_SAVE_KEY);
  check('offer is shown on death', d.text().includes('力尽きかけている'));
  check('offer state is saved at once (hp 0, enemies kept, marker set)', saved.reviveOffer === true && saved.player.hp === 0 && (saved.enemies || []).length === 1, [saved.reviveOffer, saved.player.hp, (saved.enemies || []).length]);

  // [B] "closing" the app and resuming restores the offer (no fresh enemy, no HP 0 fight)
  const d2 = makeDriver();
  d2.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true });
  d2.seed(RUN_SAVE_KEY, saved);
  await d2.mount();
  await d2.click('再開');
  await d2.flush();
  check('resume brings the revive offer back', d2.text().includes('力尽きかけている') && !!d2.findButtonContaining('広告を見て復活する'));
  const after = d2.readJSON(RUN_SAVE_KEY);
  check('same enemy (not re-rolled), still marked as offer', (after.enemies || [])[0]?.id === 'slimeA' && after.reviveOffer === true, (after.enemies || [])[0]?.id);

  // [C] declining after the restore ends the run normally
  await d2.click('あきらめる');
  await d2.flush();
  check('declining leads to the death screen', d2.text().includes('旅人は倒れた'));

  // [D] no ad left today -> resume goes straight to the death screen
  const d3 = makeDriver();
  d3.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, rewardAd: { date: jstKey(), count: 5 } });
  d3.seed(RUN_SAVE_KEY, saved);
  await d3.mount();
  await d3.click('再開');
  await d3.flush();
  check('no ad left: resume shows the death screen, not the offer', d3.text().includes('旅人は倒れた') && !d3.text().includes('力尽きかけている'));

  // [E] ad result for the revive only applies while the offer is still open
  const d4 = makeDriver();
  d4.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true });
  d4.seed(RUN_SAVE_KEY, saved);
  await d4.mount();
  await d4.click('再開');
  await d4.flush();
  await d4.click('広告を見て復活する');
  await d4.flush();
  check('give-up is disabled while the ad is loading', !d4.findButtonContaining('あきらめる'));
  await act(async () => { d4.env.window.__onRewardAdResult__('revive', 'rewarded'); });
  await d4.flush();
  const revived = d4.readJSON(RUN_SAVE_KEY);
  check('rewarded result revives with full HP and clears the marker', revived.player.hp === 72 && !revived.reviveOffer, [revived.player.hp, revived.reviveOffer]);

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
