// [A] A corrupt middle-of-run save must not silently vanish: its raw text is backed up (like the meta save).
// [B] The daily reward-ad cap rolls over at JST midnight (same as the shrine), not at the device's local
//     midnight, so changing the device time zone can't reset the cap.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const enemy = { id: 'slimeA', bookId: 'slime', name: '森スライム', asset: 'slime', hp: 999999, maxHp: 999999,
  atk: 9999, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false };
const offerRun = {
  floor: 1, node: 0, nodes: ['battle', 'battle', 'battle'], reviveOffer: true,
  player: { hp: 0, poison: 0, atkUp: 0, guard: false },
  weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 1, asset: 'dagger' }],
  armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies: [enemy],
};

async function main() {
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // [A]
  {
    const d = makeDriver();
    d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
    const broken = '{"floor":3,"node":1,"player":{"hp":40,';
    d.seed(RUN_SAVE_KEY, broken);
    await d.mount();
    await d.flush(100);
    check('corrupt run save is backed up', d.env.store[RUN_SAVE_KEY + '.corrupt_backup'] === broken, d.env.store[RUN_SAVE_KEY + '.corrupt_backup']);
    check('the game still starts normally (no resume button for a broken save)', !d.findButtonContaining('再開'));
  }

  // [B] 2026-10-20 16:00Z = 2026-10-21 01:00 JST. Cap used up for the JST date "2026-10-21".
  {
    const origDateNow = Date.now;
    const NOW = new Date('2026-10-20T16:00:00Z').getTime();
    Date.now = () => NOW;
    try {
      const d = makeDriver();
      d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, rewardAd: { date: '2026-10-21', count: 5 } });
      d.seed(RUN_SAVE_KEY, offerRun);
      await d.mount();
      await d.click('再開');
      await d.flush();
      check('cap counted on the JST date: no ad left -> no revive offer, straight to death', d.text().includes('旅人は倒れた') && !d.text().includes('力尽きかけている'));

      const d2 = makeDriver();
      d2.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, rewardAd: { date: '2026-10-20', count: 5 } });
      d2.seed(RUN_SAVE_KEY, offerRun);
      await d2.mount();
      await d2.click('再開');
      await d2.flush();
      check('yesterday\'s (JST) count is reset -> the offer is available again', d2.text().includes('力尽きかけている'));
    } finally {
      Date.now = origDateNow;
    }
  }

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
