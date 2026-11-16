// 回復アイテム(生命の果実・癒しの実・解毒草)は、戦闘後だけアイコンをタップして使える。戦闘中は武器だけ。
// 武器アイコンには攻撃力の数字が出る。
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const fire = (d, el, type) => act(async () => { el.dispatchEvent(new d.env.window.MouseEvent(type, { bubbles: true, cancelable: true })); await Promise.resolve(); });
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const item = (id, itemId, name) => ({ id, kind: 'item', itemId, name, rarity: 'common', asset: itemId });
function mkRun(hp, { poison = 0, after = true, inv } = {}) {
  const run = {
    floor: 10, node: 0,
    player: { hp, poison, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 37, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: inv || [item('b1', 'berryBig', '生命の果実'), item('b2', 'berryBig', '生命の果実'), item('s1', 'berrySmall', '癒しの実'), item('a1', 'antidote', '解毒草'), item('p1', 'spore', '力の胞子')],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
  if (after) { run.rewardPhase = 'reward'; run.drops = []; }
  else run.enemies = [{ id: 'e1', bookId: 'slime', name: 'スライム', asset: 'slime', hp: 9999, maxHp: 9999, atk: 1, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }];
  return run;
}
const tiles = (d) => [...d.container.querySelectorAll('.kw-quick .kw-qtile')];
const find = (d, label) => tiles(d).find((b) => b.textContent.includes(label));

async function boot(run) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.click('再開');
  await d.flush();
  return d;
}

async function main() {
  {
    const d = await boot(mkRun(20, { after: false }));
    check('during battle there is no quick-use row (weapons only)', !d.container.querySelector('.kw-quick'));
    check('the weapon tile shows its attack power', d.container.querySelector('.kw-wcard .kw-watk')?.textContent === '37', d.container.querySelector('.kw-wcard')?.textContent);
  }
  {
    const d = await boot(mkRun(3));
    check('after the battle the weapon icons are gone', !d.container.querySelector('.kw-hand') && !d.container.querySelector('.kw-wcard'));
    check('the buff item (力の胞子) is offered too', !!find(d, '力の胞子') && !find(d, '力の胞子').disabled, tiles(d).map((b) => b.textContent));
    check('after the battle: icon tiles with name and count', find(d, '生命の果実')?.textContent.includes('×2') && find(d, '癒しの実')?.textContent.includes('×1') && !!find(d, '解毒草'), tiles(d).map((b) => b.textContent));
    check('each tile has an icon', tiles(d).every((b) => b.querySelector('svg, img, canvas')), tiles(d).map((b) => b.innerHTML.slice(0, 60)));

    // 長押しで詳細(タップでは開かない)
    const slot = find(d, '生命の果実').closest('.kw-qslot');
    await fire(d, slot, 'pointerdown'); await d.flush(30);
    check('a long press opens the detail sheet with the description', !!d.container.querySelector('.kw-sheet h2') && d.text().includes('HPを75%回復する') && d.text().includes('所持 2個'));
    await d.click([...d.container.querySelectorAll('.kw-sheet button')].find((b) => b.textContent.includes('閉じる')));
    await d.flush();
    check('the long press did not use the item', d.readJSON(RUN_SAVE_KEY).inv.length === 5);
    await fire(d, slot, 'pointerout'); // 指を離して(クリックは発生しない)長押しの状態が残らないこと
    await fire(d, find(d, '力の胞子').closest('.kw-qslot'), 'pointerdown'); await d.flush(30);
    check('spore detail shows the real effect', d.text().includes('3ターンの間、攻撃力+40%'));
    await d.click([...d.container.querySelectorAll('.kw-sheet button')].find((b) => b.textContent.includes('閉じる')));
    await d.flush();
    await fire(d, find(d, '力の胞子').closest('.kw-qslot'), 'pointerout');

    const hpBefore = d.readJSON(RUN_SAVE_KEY).player.hp;
    await d.click(find(d, '生命の果実'));
    await d.flushUntil(() => (d.readJSON(RUN_SAVE_KEY).inv || []).length === 4, { tries: 100 });
    const after = d.readJSON(RUN_SAVE_KEY);
    check('tapping uses exactly one item and heals', after.inv.length === 4 && after.inv.filter((x) => x.itemId === 'berryBig').length === 1 && after.player.hp > hpBefore, { inv: after.inv.length, hp: after.player.hp });
    await d.flush(60);
    check('the count on the tile goes down to ×1', find(d, '生命の果実')?.textContent.includes('×1'), tiles(d).map((b) => b.textContent));
    await d.click(find(d, '生命の果実'));
    await d.flushUntil(() => !(d.readJSON(RUN_SAVE_KEY).inv || []).some((x) => x.itemId === 'berryBig'), { tries: 100 });
    await d.flush(60);
    check('the last one leaves no tile for it', !find(d, '生命の果実'), tiles(d).map((b) => b.textContent));
  }
  {
    const d = await boot(mkRun(9999));
    check('full HP, no poison: the heal tiles are disabled (the buff stays usable)', tiles(d).length === 4 && tiles(d).filter((b) => !b.textContent.includes('力の胞子')).every((b) => b.disabled), tiles(d).map((b) => b.disabled));
  }
  {
    const d = await boot(mkRun(9999, { poison: 3 }));
    check('poisoned at full HP: only the antidote is usable', find(d, '解毒草') && !find(d, '解毒草').disabled && find(d, '生命の果実').disabled);
  }
  {
    const d = await boot(mkRun(20, { inv: [] }));
    check('no healing items: no row at all', !d.container.querySelector('.kw-quick'));
  }
  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
