// Feature (user-requested): with 3+ enemies in a normal battle the enemy cards are rendered in a
// compact layout (so all three fit on one row on a phone) and a "敵 のこり N 体" counter is shown.
// Boss battles (even boss + summons = 3) keep the original layout and show no counter.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const mk = (id, extra = {}) => ({
  id, bookId: id, name: id, asset: 'slime', hp: 30, maxHp: 30, atk: 0, def: 0,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false, ...extra,
});
const mkRun = (enemies) => ({
  floor: 1, node: 0,
  player: { hp: 72, poison: 0, atkUp: 0, guard: false },
  weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
  armor: { helm: null, armor: null, charm: null }, inv: [],
  cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies,
});

async function view(enemies) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true });
  d.seed(RUN_SAVE_KEY, mkRun(enemies));
  await d.mount();
  await d.click('再開');
  await d.flush();
  const inner = d.container.querySelector('.kw-field-inner');
  return {
    compact: !!inner && inner.classList.contains('compact'),
    count: d.container.querySelector('.kw-enemy-count')?.textContent || null,
    cards: d.container.querySelectorAll('.kw-enemy').length,
  };
}

async function main() {
  const two = await view([mk('a'), mk('b')]);
  console.log('[1] 2 enemies: not compact, no counter:', !two.compact, two.count === null);
  const three = await view([mk('a'), mk('b'), mk('c')]);
  console.log('[2] 3 enemies: compact + counter "のこり 3 体":', three.compact, three.count, three.cards === 3);
  // Kill one of three for real: the dead card fades out but stays in the array, so the layout must
  // not jump back to full-size cards mid-battle and the counter must drop to 2.
  const d3 = makeDriver();
  d3.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true });
  d3.seed(RUN_SAVE_KEY, mkRun([mk('a', { hp: 1, maxHp: 1 }), mk('b'), mk('c')]));
  await d3.mount();
  await d3.click('再開');
  await d3.flush();
  await d3.click('試験の短剣');
  await d3.flush();
  const cardA = Array.from(d3.container.querySelectorAll('.kw-enemy')).find((el) => el.textContent.includes('a'));
  await d3.click(cardA);
  await d3.flushUntil(() => /のこり\s*2\s*体/.test(d3.container.querySelector('.kw-enemy-count')?.textContent || ''), { tries: 40 });
  const threeOneDead = {
    compact: d3.container.querySelector('.kw-field-inner')?.classList.contains('compact'),
    count: d3.container.querySelector('.kw-enemy-count')?.textContent || null,
  };
  console.log('[3] 3 enemies (1 killed): stays compact, counter shows 2:', threeOneDead.compact, threeOneDead.count);
  const boss = await view([mk('boss', { boss: true, hp: 500, maxHp: 1000, summons: ['slime'], chargeLine: '', bigLine: '', summonLine: '' }), mk('b'), mk('c')]);
  console.log('[4] boss + 2 summons: original layout, no counter:', !boss.compact, boss.count === null);

  const pass = !two.compact && two.count === null
    && three.compact && three.cards === 3 && /のこり\s*3\s*体/.test(three.count || '')
    && threeOneDead.compact && /のこり\s*2\s*体/.test(threeOneDead.count || '')
    && !boss.compact && boss.count === null;
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
