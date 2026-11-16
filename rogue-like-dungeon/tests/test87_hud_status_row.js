// 状態の表示(火力低下・毒・防御中・強化一覧など)は、HPバーと同じ行に並べず、2行目に回す。
// タグが増えても、HPバーの幅は削られない。何も出ないときは2行目を出さない。
const fs = require('fs');
const path = require('path');
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const css = fs.readFileSync(path.join(__dirname, '../rogue-like-dungeon/kiriwatari-no-mori.jsx'), 'utf8');
const run = (player) => ({
  floor: 10, node: 0, player,
  weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 10, asset: 'dagger' }],
  armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  enemies: [{ id: 'e1', bookId: 'slime', name: 'スライム', asset: 'slime', hp: 9999, maxHp: 9999, atk: 1, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false }],
});
async function boot(player) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, run(player));
  await d.mount();
  await d.click('再開');
  await d.flush();
  return d;
}

async function main() {
  check('CSS: the HUD wraps, the status row takes its own line, and the bar keeps a minimum width',
    /\.kw-hud \{[^}]*flex-wrap: wrap/.test(css) && /\.kw-status \{[^}]*flex: 1 1 100%/.test(css) && /\.kw-mybar \{[^}]*min-width: 9\d?px/.test(css));
  check('CSS: an empty status row is not shown', /\.kw-status:empty \{ display: none; \}/.test(css));
  {
    const d = await boot({ hp: 20, poison: 2, atkUp: 2, regen: 2, guard: true, weakT: 3 });
    const tags = [...d.container.querySelectorAll('.kw-hud .kw-status .kw-tag')].map((t) => t.textContent);
    check('with every status at once, all the tags are in the status row (outside the bar row)', tags.length === 5 && tags.some((t) => t.includes('火力低下')) && !d.container.querySelector('.kw-mybar .kw-tag'), tags);
    check('the bar, the HP number and the name are direct children of the HUD', !!d.container.querySelector('.kw-hud > .kw-mybar') && !!d.container.querySelector('.kw-hud > .kw-num') && !!d.container.querySelector('.kw-hud > .kw-me'));
  }
  {
    const d = await boot({ hp: 20, poison: 0, atkUp: 0, guard: false });
    const st = d.container.querySelector('.kw-hud .kw-status');
    check('no status: the status row is empty (so it is hidden)', !!st && st.children.length === 0 && st.textContent === '', st && st.textContent);
  }
  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
