// 袋の中の道具(回復・バフなど)は種類ごとにまとめて表示する(例: 生命の果実 ×3)。
// 捨てるのは1個ずつ。ロックは種類単位で、ロック中のものは捨てられず、使うときも後回しにされる。
// 道具は袋を開いてすぐ見える(袋の中身タブの先頭)。
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const item = (id, itemId, name, extra = {}) => ({ id, kind: 'item', itemId, name, rarity: 'common', asset: itemId, ...extra });
const mkRun = () => ({
  floor: 10, node: 0,
  player: { hp: 10, poison: 0, atkUp: 0, guard: false },
  weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 10, asset: 'dagger' }],
  armor: { helm: null, armor: null, charm: null },
  inv: [item('b1', 'berryBig', '生命の果実'), item('b2', 'berryBig', '生命の果実'), item('b3', 'berryBig', '生命の果実'),
    item('s1', 'berrySmall', '癒しの実'), item('p1', 'spore', '力の胞子'), item('p2', 'spore', '力の胞子')],
  cds: {}, lastRareSeen: 0, orbBagBonus: 0, rewardPhase: 'reward', drops: [],
});
const rows = (d) => [...d.container.querySelectorAll('.kw-stack')];
const rowOf = (d, name) => rows(d).find((r) => r.textContent.includes(name));
const btn = (row, label) => [...row.querySelectorAll('button')].find((b) => b.textContent.includes(label) || b.getAttribute('aria-label')?.includes(label));
const invOf = (d, itemId) => d.readJSON(RUN_SAVE_KEY).inv.filter((x) => x.itemId === itemId);

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click('袋・装備');
  await d.flush();

  check('same items are one row each: 3 rows for 6 items', rows(d).length === 3, rows(d).map((r) => r.textContent));
  check('the row shows the count', rowOf(d, '生命の果実')?.textContent.includes('×3') && rowOf(d, '力の胞子')?.textContent.includes('×2'));
  const scroll = d.container.querySelector('.kw-overlay .kw-sheet div[style*="overflow-y: auto"]') || d.container.querySelector('.kw-overlay [style*="overflow-y"]');
  check('the bag opens on the items tab: the stacked rows are visible without scrolling or switching', !!scroll && !!scroll.querySelector('.kw-stack') && !d.text().includes('装備中の武器'));

  // 捨てる: 1個ずつ
  await d.click(btn(rowOf(d, '生命の果実'), '捨てる'));
  await d.flush(400);
  check('discard removes exactly one', invOf(d, 'berryBig').length === 2 && rowOf(d, '生命の果実')?.textContent.includes('×2'), invOf(d, 'berryBig').length);

  // ロック(種類単位)
  await d.click(btn(rowOf(d, '生命の果実'), 'ロックする'));
  await d.flush(400);
  check('lock marks every item of the kind', invOf(d, 'berryBig').every((x) => x.locked) && invOf(d, 'berryBig').length === 2);
  check('all locked: discard is disabled', btn(rowOf(d, '生命の果実'), '捨てる').disabled);
  await d.click(btn(rowOf(d, '生命の果実'), 'ロックを解除'));
  await d.flush(400);
  check('unlock releases them all', invOf(d, 'berryBig').every((x) => !x.locked));

  // 使う: ロックされていないものを先に使う(ロック中の1個が残る)
  const run1 = mkRun();
  run1.inv = [item('l1', 'berrySmall', '癒しの実', { locked: true }), item('l2', 'berrySmall', '癒しの実')];
  const d2 = makeDriver();
  d2.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills: {} });
  d2.seed(RUN_SAVE_KEY, run1);
  await d2.mount(); await d2.click('再開'); await d2.flush(); await d2.click('袋・装備'); await d2.flush();
  check('partly locked stack still shows as one row with the lock icon', rows(d2).length === 1 && rows(d2)[0].textContent.includes('×2'));
  await d2.click(btn(rowOf(d2, '癒しの実'), '使う'));
  await d2.flush(300);
  const left = d2.readJSON(RUN_SAVE_KEY).inv.filter((x) => x.itemId === 'berrySmall');
  check('use takes the unlocked one first and heals', left.length === 1 && left[0].id === 'l1' && d2.readJSON(RUN_SAVE_KEY).player.hp > 10, left);

  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
