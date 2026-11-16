// 袋の中は「装備(装備中の武器・防具)」「袋の中身」「スキルツリー」のタブで切り替える。
// 既定は「袋の中身」(章の頭の戦闘準備だけ「装備」)。戦闘中は「装備」タブを出さない。
// スキルツリーのタブは、結晶か習得済みスキルがあるときだけ出る。袋を閉じたら既定のタブに戻る。
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const item = (id, itemId, name) => ({ id, kind: 'item', itemId, name, rarity: 'common', asset: itemId });
const mkRun = ({ battle = false } = {}) => {
  const run = {
    floor: 10, node: 0,
    player: { hp: 20, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: { id: 'h1', kind: 'armor', slot: 'helm', name: '試験の兜', rarity: 'common', hp: 5, asset: 'helm' }, armor: null, charm: null },
    inv: [item('b1', 'berryBig', '生命の果実'),
      { id: 'w2', kind: 'weapon', type: 'bow', name: '予備の弓', rarity: 'common', atk: 8, asset: 'bow' }],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
  if (battle) run.enemies = [{ id: 'e1', bookId: 'slime', name: 'スライム', asset: 'slime', hp: 9999, maxHp: 9999, atk: 1, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }];
  else { run.rewardPhase = 'reward'; run.drops = []; }
  return run;
};
const tabs = (d) => [...d.container.querySelectorAll('[role="tab"]')];
const tabNames = (d) => tabs(d).map((t) => t.textContent.replace(/\s*\d+\/\d+$/, ''));
const selected = (d) => tabs(d).find((t) => t.getAttribute('aria-selected') === 'true')?.textContent || null;

async function boot(run, meta = {}, openLabel = '袋・装備') {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills: {}, ...meta });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click(openLabel);
  await d.flush();
  return d;
}

async function main() {
  {
    const d = await boot(mkRun(), { dewBank: 5 });
    check('tabs: 装備 / 袋の中身 / スキルツリー', tabNames(d).join('|') === '装備|袋の中身|スキルツリー', tabNames(d));
    check('opens on 袋の中身: the stacked items, no equipment sections', selected(d)?.includes('袋の中身') && !!d.container.querySelector('.kw-stack') && !d.text().includes('装備中の武器'), selected(d));
    check('袋の中身 shows the spare weapon with 装備する', d.text().includes('予備の弓') && !!d.findButtonContaining('装備する'));

    const scrollOf = () => d.container.querySelector('.kw-sheet div[style*="overflow-y: auto"]');
    check('the scroll area has its own top padding, so the content does not touch the tab bar', parseInt(scrollOf()?.style.paddingTop, 10) >= 8, scrollOf()?.style.padding);
    await d.bagTab('装備');
    check('装備 tab: equipped weapons and armor, no stacks and no spare gear', d.text().includes('装備中の武器') && d.text().includes('## 防具') && d.text().includes('試験の短剣') && d.text().includes('試験の兜')
      && !d.container.querySelector('.kw-stack') && !d.text().includes('予備の弓'));
    // 装備中のロックは、カードの右上に置いた鍵のアイコン(別の行を取らない。押す範囲は40×40のまま)
    const locks = [...d.container.querySelectorAll('.kw-eqlock')];
    check('each equipped card has one lock icon button (weapon + helm = 2), not nested in the card button', locks.length === 2 && locks.every((b) => !b.closest('button.kw-cell') && b.textContent.trim() === ''), locks.length);
    const css = require('fs').readFileSync(require('path').join(__dirname, '../rogue-like-dungeon/kiriwatari-no-mori.jsx'), 'utf8');
    check('the lock is small (28px) so it does not cover the text, and its hit area stays 40px or more', /\.kw-eqwrap \.kw-eqlock \{[^}]*width: 28px; height: 28px/.test(css) && /\.kw-eqwrap \.kw-eqlock::before \{[^}]*inset: -7px/.test(css));
    await d.click(locks[0]); await d.flush(400);
    check('tapping it locks the weapon without unequipping it', d.readJSON(RUN_SAVE_KEY).weapons[0]?.locked === true && d.container.querySelector('.kw-eqlock')?.getAttribute('aria-label') === 'ロックを解除');
    check('the fixed header (HP) stays on every tab', d.text().includes('20 / '));

    await d.bagTab('スキルツリー');
    check('スキルツリー tab: embedded tree with the crystal count, no second title or overlay', d.text().includes('精の結晶') && !!d.container.querySelector('[role="button"]') && !d.text().includes('装備中の武器') && !d.container.querySelector('.kw-stack'));
    const row = [...d.container.querySelectorAll('[role="button"]')].find((b) => /結晶$/.test(b.textContent.trim()));
    await d.click(row); await d.flush();
    await d.click(d.findButtonContaining('この結晶で習得する')); await d.flush(400);
    check('buying a skill from the tab works and spends crystals', Object.keys(d.readJSON(SAVE_KEY).skills || {}).length === 1 && d.readJSON(SAVE_KEY).dewBank < 5, d.readJSON(SAVE_KEY));

    // 閉じて開き直すと、既定のタブに戻る
    await d.click([...d.container.querySelectorAll('.kw-sheet button')].find((b) => !b.getAttribute('role') && b.querySelector('svg')));
    await d.flush();
    await d.click('袋・装備'); await d.flush();
    check('reopening the bag returns to 袋の中身', selected(d)?.includes('袋の中身'), selected(d));
  }
  {
    const d = await boot(mkRun());
    check('no crystals and no skills: no スキルツリー tab', tabNames(d).join('|') === '装備|袋の中身', tabNames(d));
  }
  {
    const d = await boot(mkRun(), { skills: { bladeBasics: true } });
    check('an owned skill alone is enough to show the tab', tabNames(d).includes('スキルツリー'), tabNames(d));
  }
  {
    const d = await boot(mkRun({ battle: true }), { dewBank: 5 }, '袋 (');
    check('during battle there is no 装備 tab (items and skills only)', tabNames(d).join('|') === '袋の中身|スキルツリー' && !d.text().includes('装備中の武器'), tabNames(d));
  }
  {
    const d = await boot(mkRun({ battle: true }), {}, '袋 (');
    check('during battle with nothing else to show, the tab bar is hidden', tabs(d).length === 0);
  }
  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
