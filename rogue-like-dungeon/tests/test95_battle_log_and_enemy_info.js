// 機能: 戦闘ログを【戦闘開始】から終わりまで全部残す/敵の札を長押しすると、いま効いている状態の説明が出る。
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
const fire = (d, el, type) => act(async () => { el.dispatchEvent(new d.env.window.MouseEvent(type, { bubbles: true, cancelable: true })); await Promise.resolve(); });

const enemy = (id, extra = {}) => ({
  id, bookId: 'slime', name: id, asset: 'slime', hp: 100000, maxHp: 100000, atk: 0, def: 0,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false, ...extra,
});
const weapon = (id, type, atk) => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'common', atk, asset: type });
const mkRun = (weapons, enemies) => ({
  floor: 1, node: 0, player: { hp: 600, poison: 0, atkUp: 0, guard: false }, weapons,
  armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies,
});
async function start(run) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, bonusHp: 600 });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.click('再開');
  await d.flush();
  return d;
}
async function attackOnce(d, weaponName) {
  const before = d.readJSON(RUN_SAVE_KEY).turn || 1;
  await d.click(weaponName);
  await d.flushUntil(() => (d.readJSON(RUN_SAVE_KEY).turn || 1) !== before, { tries: 80 });
  await d.flush();
}
const openLog = async (d) => { await fire(d, d.container.querySelector('.kw-log'), 'click'); await d.flush(); };
const popupLines = (d) => Array.from(d.container.querySelectorAll('.kw-overlay .kw-sheet div[style*="overflow"] > div')).map((x) => x.textContent);

async function main() {
  Math.random = () => 0.5;
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // [A] 30行を超えても、ターン1の行が消えない
  {
    const d = await start(mkRun([weapon('短剣', 'dagger', 1)], [enemy('A')]));
    for (let i = 0; i < 18; i++) await attackOnce(d, '試験の短剣');
    await openLog(d);
    const lines = popupLines(d);
    check('log: more than 30 lines are kept within one battle', lines.length > 30, lines.length);
    check('log: the line at the start of the battle is still there', lines[0] === '【戦闘再開】', lines.slice(0, 3));
  }

  // [B] 敵の札の長押しで状態の説明が出る。短いタップでは出ない。長押しでは攻撃しない
  {
    const d = await start(mkRun([weapon('大剣', 'greatsword', 1)], [
      enemy('A', { mut: 'regen', poisonT: 2, poisonDmg: 7, atkDown: 1 }), enemy('B'),
    ]));
    const cardOf = (name) => Array.from(d.container.querySelectorAll('.kw-enemy')).find((el) => el.querySelector('.kw-ename')?.textContent === name);
    await fire(d, cardOf('A'), 'pointerdown'); await fire(d, cardOf('A'), 'pointerup'); await d.flush();
    check('enemy info: a short tap does not open the sheet', !d.container.querySelector('.kw-enemy-info'));
    await fire(d, cardOf('A'), 'pointerdown'); await d.flush(30);
    const sheet = d.container.querySelector('.kw-enemy-info');
    const txt = sheet ? sheet.textContent : '';
    check('enemy info: a long press opens the sheet', !!sheet);
    check('enemy info: it explains the mutation', txt.includes('変異「再生」') && txt.includes('8%回復'), txt);
    check('enemy info: it explains poison with damage and turns', txt.includes('毎ターン7のダメージ') && txt.includes('あと2ターン'));
    check('enemy info: it explains 攻↓', txt.includes('攻撃力が20%下がっている'));
    await fire(d, cardOf('A'), 'pointerup');
    await d.click('閉じる'); await d.flush();
    check('enemy info: the sheet closes', !d.container.querySelector('.kw-enemy-info'));

    // 武器を選んで狙う途中でも、長押しは攻撃にならない
    await d.click('試験の大剣'); await d.flush();
    await fire(d, cardOf('B'), 'pointerdown'); await d.flush(30);
    await fire(d, cardOf('B'), 'pointerup'); await fire(d, cardOf('B'), 'click'); await d.flush();
    const run = d.readJSON(RUN_SAVE_KEY);
    check('enemy info: a long press while aiming does not attack', run.enemies.find((x) => x.id === 'B').hp === 100000 && (run.turn || 1) === 1, [run.enemies.find((x) => x.id === 'B').hp, run.turn]);
    check('enemy info: an enemy with nothing on it says so', d.container.querySelector('.kw-enemy-info')?.textContent.includes('いま効いている強化や弱体はありません'));
  }

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
