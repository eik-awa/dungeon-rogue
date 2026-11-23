// 武器の特性とエンチャント、敵の状態表示、宝箱の雫:
//   - 装備を選ぶ画面(戦利品・袋・交代先)に、武器種の特性とエンチャントを出す
//   - 袋に同じ武器種があれば、落ちた武器に「新しい武器種です」は出さない(装備していなくても)
//   - 敵を狙うとき、弱点のときだけでなく、耐性のときも札で知らせる
//   - 笛の攻撃ダウン・斧の防御ダウン・エンチャントの霜縛り/蝕みを、敵の札に出す
//   - エンチャント(吸魂/貫き/弱点穿ち/理破り/疾風/霜縛り/蝕み)の効果
//   - 宝箱から、まれに宝樹の雫が出る。出たときは広告の案内も出す
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const fire = (d, el, type) => act(async () => { el.dispatchEvent(new d.env.window.MouseEvent(type, { bubbles: true, cancelable: true })); await Promise.resolve(); });
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const wp = (id, type, extra = {}) => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'common', atk: 100, asset: type, ...extra });
const foe = (id, extra = {}) => ({
  id, bookId: 'slime', name: `敵${id}`, asset: 'slime', hp: 9999, maxHp: 9999, atk: 1, def: 0,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false, ...extra,
});
const mkRun = ({ weapons, enemies, inv = [], reward = false, drops = [], hp = 500, extra = {} }) => {
  const run = {
    floor: 10, node: 0,
    player: { hp, poison: 0, atkUp: 0, guard: false },
    weapons, armor: { helm: null, armor: null, charm: null }, inv,
    cds: {}, lastRareSeen: 0, orbBagBonus: 0, ...extra,
  };
  if (reward) { run.rewardPhase = 'reward'; run.drops = drops; } else run.enemies = enemies;
  return run;
};
async function boot(run, meta = {}) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills: {}, bonusHp: 500, ...meta });
  d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.click('再開');
  await d.flush();
  return d;
}
const saved = (d) => d.readJSON(RUN_SAVE_KEY);
const weaponBtn = (d, name) => [...d.container.querySelectorAll('.kw-wcard')].find((b) => b.getAttribute('aria-label')?.startsWith(name));
// 武器で1回攻撃して、敵ターンの終わりまで待つ(敵が1体のときは、狙う相手を選ばなくてよい)
async function attack(d, name) {
  const before = JSON.stringify(saved(d).enemies.map((e) => e.hp));
  await d.click(weaponBtn(d, name));
  await d.flushUntil(() => JSON.stringify((saved(d).enemies || []).map((e) => e.hp)) !== before, { tries: 200 });
  await d.flush(60); await d.flush(60); await d.flush(60);
}
async function damageOf(weapon, enemy, meta) {
  const d = await boot(mkRun({ weapons: [weapon], enemies: [enemy] }), meta);
  await attack(d, weapon.id.length ? `試験の${weapon.id}` : '');
  return { d, dmg: enemy.hp - saved(d).enemies[0].hp };
}

async function main() {
  Math.random = () => 0.5;

  // ---- 武器の一覧には、攻撃力・属性・エンチャントだけを出す。特性などの詳細は長押し
  {
    const drops = [wp('剣', 'greatsword', { ench: 'vampire', enchLv: 3 }), wp('杖', 'staff')];
    const d = await boot(mkRun({ weapons: [wp('短', 'dagger')], enemies: [], reward: true, drops, inv: [wp('弓', 'bow')] }));
    const cells = [...d.container.querySelectorAll('.kw-cell')];
    check('a dropped weapon shows attack, element and the enchant (no type trait text)', cells[0].textContent.includes('攻 100') && cells[0].textContent.includes('属性') && cells[0].textContent.includes('吸魂') && !cells[0].textContent.includes('溜めの一撃'), cells[0].textContent);
    check('the list shows only the enchant name and pips (no level text, no effect sentence: those are in the long-press detail)', !cells[0].textContent.includes('Lv.') && !cells[0].textContent.includes('回復する'), cells[0].textContent);
    check('the enchant shows its icon and 3 pips (Lv3 = all filled)', !!cells[0].querySelector('.kw-ench svg') && cells[0].querySelectorAll('.kw-pip.on').length === 3);
    check('a weapon without an enchant has no enchant row', cells[1].querySelectorAll('.kw-ench').length === 0 && d.container.querySelectorAll('.kw-ench').length === 1);
    check('a note says that long-pressing shows the details', d.text().includes('武器を長押しすると、詳細が見られます'));
    await fire(d, cells[0], 'pointerdown'); await d.flush(600);
    check('long-pressing a dropped weapon opens its detail (trait + enchant effect)', d.text().includes('溜めの一撃。威力2.2倍') && d.text().includes('与えたダメージの8%を回復する。') && !!d.container.querySelector('.kw-ench-panel'), d.text().slice(-300));
    check('the long press did not pick it up', saved(d).drops.length === 2 && !saved(d).inv.some((x) => x.id === '剣'));
    await d.click([...d.container.querySelectorAll('.kw-sheet button')].find((b) => b.textContent.includes('閉じる'))); await d.flush();
    await fire(d, cells[0], 'pointerout');
    check('closing the detail returns to the rewards', !d.container.querySelector('.kw-ench-panel'));
    await d.click(d.findButtonContaining('拾う')); await d.flush();
    check('a plain tap still picks it up', saved(d).inv.some((x) => x.id === '剣') || saved(d).weapons.some((x) => x && x.id === '剣'));
  }
  {
    // 交代先を選ぶ画面: 入れ替える新しい武器も、攻撃力・属性・エンチャントだけ。長押しで詳細
    const d = await boot(mkRun({ weapons: [wp('甲', 'dagger'), wp('乙', 'bow'), wp('丙', 'book')], enemies: [], reward: true, drops: [], inv: [wp('新', 'axe', { ench: 'pierce' })] }));
    await d.click('袋・装備'); await d.flush();
    const spare = [...d.container.querySelectorAll('.kw-cell')].find((c) => c.textContent.includes('試験の新'));
    check('the bag list shows only attack, element and the enchant of a spare weapon', spare.textContent.includes('貫き') && !spare.textContent.includes('重い一撃で敵の守りを砕く') && !!spare.querySelector('.kw-ench svg') && !spare.querySelector('.kw-ench-effect'), spare.textContent);
    await fire(d, spare, 'pointerdown'); await d.flush(600);
    check('long-pressing it in the bag opens the detail', d.text().includes('重い一撃で敵の守りを砕く') && d.text().includes('敵の防御力の15%を無視して攻撃する。'));
    await d.click([...d.container.querySelectorAll('.kw-sheet button')].find((b) => b.textContent.includes('閉じる'))); await d.flush();
    await fire(d, spare, 'pointerout');
    await d.click('装備する'); await d.flush();
    check('swap sheet shows the incoming weapon in brief (attack, element, enchant)', d.text().includes('どの武器と交代しますか') && d.text().includes('貫き') && !d.text().includes('重い一撃で敵の守りを砕く') && !!d.container.querySelector('.kw-ench svg'), d.text().slice(0, 300));
    {
      const inc = [...d.container.querySelectorAll('.kw-sheet')].find((x) => x.textContent.includes('どの武器と交代しますか')).querySelector('div[style*="user-select"]');
      await fire(d, inc, 'pointerdown'); await d.flush(600);
      check('long-pressing the incoming weapon opens its detail too', d.text().includes('重い一撃で敵の守りを砕く') && !!d.container.querySelector('.kw-ench-panel'));
      await d.click([...d.container.querySelectorAll('.kw-sheet button')].find((b) => b.textContent.includes('閉じる'))); await d.flush();
      await fire(d, inc, 'pointerout');
    }
    check('the equipped weapons in the picker are compact (no inline trait), with a long-press hint', !d.text().includes('素早い二連撃') && d.text().includes('長押しすると、詳細が見られます'));
    const cell = [...d.container.querySelectorAll('.kw-sheet .kw-cell')].find((c) => c.textContent.includes('試験の甲'));
    await fire(d, cell, 'pointerdown'); await d.flush(600);
    check('long-pressing an equipped weapon opens its detail (trait + tags) above the picker', d.text().includes('素早い二連撃') && d.text().includes('2回攻撃') && d.text().includes('どの武器と交代しますか'));
    check('the long press did not swap', saved(d).weapons.some((w) => w && w.id === '甲') && saved(d).inv.some((w) => w.id === '新'));
    await d.click([...d.container.querySelectorAll('.kw-sheet button')].find((b) => b.textContent.includes('閉じる'))); await d.flush();
    await fire(d, cell, 'pointerout');
    check('closing the detail returns to the picker', d.text().includes('どの武器と交代しますか') && !d.text().includes('2回攻撃'));
    await d.click('これと交代する'); await d.flush();
    check('a plain tap still swaps', saved(d).weapons.some((w) => w && w.id === '新') && saved(d).inv.some((w) => w.id === '甲'));
  }

  // ---- 長押しの詳細: エンチャントの枠に、効果・3段階の値・今の段階が見える
  {
    const run = mkRun({ weapons: [wp('短', 'dagger', { ench: 'weakbane', enchLv: 2 })], enemies: [foe('A')] });
    const d2 = await boot(run);
    await fire(d2, weaponBtn(d2, '試験の短').parentElement, 'pointerdown'); await d2.flush(600);
    const panel = d2.container.querySelector('.kw-ench-panel');
    check('detail sheet: a colored enchant panel with its icon, name, level and the effect sentence', !!panel && !!panel.querySelector('svg') && panel.textContent.includes('弱点穿ち') && panel.textContent.includes('Lv.2') && panel.textContent.includes('弱点を突いたときの倍率が1.6倍から1.7倍になる。'), panel && panel.textContent);
    check('detail sheet: no per-level table (only this weapon\'s effect)', !panel.textContent.includes('段階ごと') && !panel.textContent.includes('1.65倍') && !panel.textContent.includes('1.8倍'), panel.textContent);
    check('detail sheet: the type trait sits in its own box', d2.container.querySelector('.kw-trait-box')?.textContent.includes('武器の特性'));
  }

  // ---- 耐性の敵も札で知らせる
  {
    const meta = { discovered: { slime: { w: ['斬'], r: ['打'] } } };
    const d = await boot(mkRun({ weapons: [wp('短', 'dagger'), wp('斧', 'axe')], enemies: [foe('A', { weak: ['斬'], resist: ['打'] }), foe('B', { weak: ['斬'], resist: ['打'] })] }), meta);
    await d.click(weaponBtn(d, '試験の短')); await d.flush();
    check('weak spot: every enemy is marked as a good target', d.container.querySelectorAll('.kw-enemy.goodTarget').length === 2 && d.container.querySelectorAll('.kw-enemy.badTarget').length === 0);
    await d.click(weaponBtn(d, '試験の斧')); await d.flush();
    check('resisted weapon: every enemy is marked as a bad target', d.container.querySelectorAll('.kw-enemy.badTarget').length === 2 && d.container.querySelectorAll('.kw-enemy.goodTarget').length === 0);
    const css = require('fs').readFileSync(require('path').join(__dirname, '../rogue-like-dungeon/kiriwatari-no-mori.jsx'), 'utf8');
    check('the bad-target tag says it is hard to hurt', /\.kw-enemy\.badTarget::before \{ content: "効きにくい…"/.test(css));
  }
  {
    // まだ弱点・耐性を知らない敵には、どちらも出さない
    const d = await boot(mkRun({ weapons: [wp('短', 'dagger'), wp('斧', 'axe')], enemies: [foe('A', { weak: ['斬'], resist: ['打'] }), foe('B', { weak: ['斬'], resist: ['打'] })] }));
    await d.click(weaponBtn(d, '試験の斧')); await d.flush();
    check('unknown affinity: no hint at all (nothing leaks)', d.container.querySelectorAll('.kw-enemy.badTarget').length === 0 && d.container.querySelectorAll('.kw-enemy.goodTarget').length === 0);
  }

  // ---- 敵の状態表示
  {
    const { d } = await damageOf(wp('笛', 'instrument'), foe('A', { hp: 9999 }));
    const chip = d.container.querySelector('.kw-enemy .kw-chip.debuff');
    check('instrument: the enemy card says "攻↓ nT"', chip && /^攻↓ \dT$/.test(chip.textContent), chip?.textContent);
  }
  {
    const { d } = await damageOf(wp('斧', 'axe'), foe('A', { def: 30 }));
    const chip = [...d.container.querySelectorAll('.kw-enemy .kw-chip.debuff')].find((c) => c.textContent.includes('防↓'));
    check('axe: the enemy card says "防↓ 2"', chip && chip.textContent === '防↓ 2', chip?.textContent);
    check('axe: the defense is really lowered (30 -> 28)', saved(d).enemies[0].def === 28, saved(d).enemies[0].def);
  }
  {
    // 防御ダウンは積み重なる
    const d = await boot(mkRun({ weapons: [wp('斧', 'axe'), wp('斧2', 'axe')], enemies: [foe('A', { def: 30 })] })); // 斧は再使用待ちがあるので、2本で続けて使う
    await attack(d, '試験の斧');
    await attack(d, '試験の斧2');
    check('axe twice: 4 in total on the card', d.container.querySelector('.kw-enemy')?.textContent.includes('防↓ 4'), d.container.querySelector('.kw-enemy')?.textContent);
  }

  // ---- エンチャントの効果(Math.random = 0.5 なので、ダメージのぶれは無く、短剣の会心も出ない)
  // 効果の大きさは Lv.1 : Lv.2 : Lv.3 = 1 : 2 : 4。完全な無視・無効にはならない小さめの値
  const dag = (extra) => wp('短', 'dagger', extra);
  {
    const none = await damageOf(dag(), foe('A', { def: 30 }));
    check('baseline: dagger 100 vs def 30 = 2 x 70', none.dmg === 140, none.dmg);
    const p1 = await damageOf(dag({ ench: 'pierce', enchLv: 1 }), foe('A', { def: 30 }));
    const p3 = await damageOf(dag({ ench: 'pierce', enchLv: 3 }), foe('A', { def: 30 }));
    check('貫き Lv1: ignores 15% of the defense (30 -> 26: 2 x 74)', p1.dmg === 148, p1.dmg);
    check('貫き Lv3: ignores 60% (30 -> 12: 2 x 88), not all of it', p3.dmg === 176, p3.dmg);
    check('貫き: the log says how much defense was ignored (Lv1: 4 x 2 hits, Lv3: 18 x 2)', p1.d.text().includes('貫きの力で、敵の防御を8無視した') && p3.d.text().includes('貫きの力で、敵の防御を36無視した'), p1.d.text().slice(-400));
    const p0 = await damageOf(dag({ ench: 'pierce', enchLv: 3 }), foe('A', { def: 0 }));
    check('貫き: no log when the enemy has no defense', !p0.d.text().includes('貫きの力'));
  }
  {
    const none = await damageOf(dag(), foe('A', { def: 30, weak: ['斬'] }));
    const w1 = await damageOf(dag({ ench: 'weakbane', enchLv: 1 }), foe('A', { def: 30, weak: ['斬'] }));
    const w3 = await damageOf(dag({ ench: 'weakbane', enchLv: 3 }), foe('A', { def: 30, weak: ['斬'] }));
    check('baseline weak spot: 2 x (160 - 30)', none.dmg === 260, none.dmg);
    check('弱点穿ち Lv1: x1.65 (2 x 135)', w1.dmg === 270, w1.dmg);
    check('弱点穿ち Lv3: x1.8 (2 x 150)', w3.dmg === 300, w3.dmg);
    const notWeak = await damageOf(dag({ ench: 'weakbane', enchLv: 3 }), foe('A', { def: 30 }));
    check('弱点穿ち: no effect on a normal target', notWeak.dmg === 140, notWeak.dmg);
    check('弱点穿ち: the log shows the multiplier (1.6 -> 1.8)', w3.d.text().includes('弱点穿ちの力で、弱点への一撃が重くなった(1.6倍→1.8倍)'), w3.d.text().slice(-400));
    check('弱点穿ち: no log on a normal target', !notWeak.d.text().includes('弱点穿ちの力'));
  }
  {
    const none = await damageOf(dag(), foe('A', { def: 30, resist: ['斬'] }));
    const r1 = await damageOf(dag({ ench: 'resbreak', enchLv: 1 }), foe('A', { def: 30, resist: ['斬'] }));
    const r3 = await damageOf(dag({ ench: 'resbreak', enchLv: 3 }), foe('A', { def: 30, resist: ['斬'] }));
    check('baseline resist: 2 x (50 - 30)', none.dmg === 40, none.dmg);
    check('理破り Lv1: resist 0.5 -> 0.6 (2 x 30)', r1.dmg === 60, r1.dmg);
    check('理破り Lv3: resist 0.5 -> 0.9 (2 x 60), still below normal', r3.dmg === 120 && r3.dmg < 140, r3.dmg);
    check('理破り: the log shows the multiplier (0.5 -> 0.6)', r1.d.text().includes('理破りの力で、耐性を押し破った(0.5倍→0.6倍)'), r1.d.text().slice(-400));
  }
  {
    // 吸魂: 与えたダメージ 140 の 2% / 4% / 8% (小数は四捨五入)
    for (const [lv, heal] of [[1, 3], [2, 6], [3, 11]]) {
      const { d, dmg } = await damageOf(dag({ ench: 'vampire', enchLv: lv }), foe('A', { def: 30 }));
      check(`吸魂 Lv${lv}: heals ${2 ** (lv - 1) * 2}% of 140 (${heal})`, dmg === 140 && d.text().includes(`吸魂の力で、HPを${heal}回復した`) && !d.text().includes('余韻でHP'), d.text().slice(0, 100));
    }
  }
  {
    // 疾風: 確率(Lv1 10% / Lv3 40%)で再使用待ちがなくなる
    const plain = await damageOf(wp('剣', 'greatsword'), foe('A'));
    check('greatsword: cooldown left after the turn is 2', saved(plain.d).cds['剣'] === 2, saved(plain.d).cds);
    const miss = await damageOf(wp('剣', 'greatsword', { ench: 'swift', enchLv: 3 }), foe('A'));
    check('疾風 Lv3: not triggered at random 0.5 (needs under 40%): cooldown stays 2', saved(miss.d).cds['剣'] === 2, saved(miss.d).cds);
    Math.random = () => 0.3;
    const hit3 = await damageOf(wp('剣', 'greatsword', { ench: 'swift', enchLv: 3 }), foe('A'));
    check('疾風 Lv3: triggers at random 0.3 -> no cooldown', !(saved(hit3.d).cds['剣'] > 0), saved(hit3.d).cds);
    check('疾風: the log says the weapon can be used again', hit3.d.text().includes('疾風の力で、試験の剣はすぐにまた使える') && !miss.d.text().includes('疾風の力'), hit3.d.text().slice(-400));
    const miss1 = await damageOf(wp('剣', 'greatsword', { ench: 'swift', enchLv: 1 }), foe('A'));
    check('疾風 Lv1: does not trigger at random 0.3 (needs under 10%)', saved(miss1.d).cds['剣'] === 2, saved(miss1.d).cds);
    Math.random = () => 0.5;
  }
  {
    // 霜縛り: 確率(Lv1 15% / Lv3 60%)で、攻撃した敵の攻撃力が下がる
    const chip = (r) => [...r.d.container.querySelectorAll('.kw-enemy .kw-chip.debuff')].find((c) => c.textContent.includes('攻↓'));
    const miss = await damageOf(dag({ ench: 'chill', enchLv: 1 }), foe('A'));
    check('霜縛り Lv1: not triggered at random 0.5', !chip(miss) && !(saved(miss.d).enemies[0].atkDown > 0), saved(miss.d).enemies[0].atkDown);
    Math.random = () => 0.5;
    const hit = await damageOf(dag({ ench: 'chill', enchLv: 3 }), foe('A'));
    check('霜縛り Lv3: not triggered at random 0.5 either (60% means under 0.6 -> yes it is)', !!chip(hit) && saved(hit.d).enemies[0].atkDown > 0, saved(hit.d).enemies[0].atkDown);
    check('霜縛り: the card shows 攻↓ and it is in the save', !!chip(hit));
  }
  {
    const v1 = await damageOf(dag({ ench: 'venom', enchLv: 1 }), foe('A'));
    const v3 = await damageOf(dag({ ench: 'venom', enchLv: 3 }), foe('A'));
    check('蝕み Lv1: poisoned, 5% of the attack per turn (5)', !!v1.d.container.querySelector('.kw-enemy .kw-chip.poison') && saved(v1.d).enemies[0].poisonDmg === 5, saved(v1.d).enemies[0].poisonDmg);
    check('蝕み Lv3: 20% (20), still weaker than the spear', saved(v3.d).enemies[0].poisonDmg === 20, saved(v3.d).enemies[0].poisonDmg);
    const plainSword = await damageOf(dag(), foe('A'));
    check('a weapon without the enchant never poisons', !plainSword.d.container.querySelector('.kw-enemy .kw-chip.poison'));
    const spear = await damageOf(wp('槍', 'spear', { ench: 'venom', enchLv: 3 }), foe('A'));
    check('蝕み on a spear keeps the spear poison (30%), not weaker', saved(spear.d).enemies[0].poisonDmg === 30, saved(spear.d).enemies[0].poisonDmg);
  }
  {
    // 段階の表示: 説明の数値・Lv・✦ の数
    const d = await boot(mkRun({ weapons: [dag({ ench: 'vampire', enchLv: 2 })], enemies: [foe('A')], inv: [wp('杖', 'staff', { ench: 'pierce', enchLv: 3 })] }));
    const card = weaponBtn(d, '試験の短');
    check('the weapon card shows the enchant icon and one filled pip per level (Lv2 = 2 of 3), with the level in its label', !!card.querySelector('.kw-wench svg') && card.querySelectorAll('.kw-pip').length === 3 && card.querySelectorAll('.kw-pip.on').length === 2 && card.textContent.includes('吸魂 Lv.2'), card.textContent);
  }
  {
    // 旧データ(段階の無いエンチャント)は Lv1 として扱う
    const d = await boot(mkRun({ weapons: [wp('短', 'dagger', { ench: 'vampire' })], enemies: [foe('A')] }));
    check('an enchant without a level is treated as Lv1', weaponBtn(d, '試験の短').textContent.includes('Lv.1'));
  }
  {
    const d = await boot(mkRun({ weapons: [wp('短', 'dagger', { ench: 'vampire' })], enemies: [foe('A')] }));
    const card = weaponBtn(d, '試験の短');
    check('an enchanted weapon icon carries a mark, and its label names the enchant', !!card.querySelector('.kw-wench') && card.textContent.includes('吸魂'), card.textContent);
  }

  // ---- 倒したレアが落とす伝説・エピックの武器に、エンチャントが付くことがある
  {
    Math.random = () => 0.01;
    const d = await boot(mkRun({ weapons: [wp('短', 'dagger')], enemies: [foe('R', { rare: true, hp: 1, maxHp: 1, fleeIn: 3 })] }));
    await d.click(weaponBtn(d, '試験の短'));
    await d.flushUntil(() => d.text().includes('勝 利'), { tries: 200 });
    check('a rare drop can carry an enchant (and the reward screen shows it)', !!d.container.querySelector('.kw-ench svg') && d.container.querySelectorAll('.kw-ench').length === 1, d.text().slice(0, 300));
    Math.random = () => 0.5;
  }

  // ---- 宝箱から、まれに宝樹の雫
  const chestRun = () => mkRun({ weapons: [wp('短', 'dagger')], enemies: [], extra: { nodes: ['battle', 'chest', 'battle'], midPhase: 'chest', eventDone: false, midDrops: [], node: 1 } });
  const adResult = (d, ctx, r) => act(async () => { d.env.window.__onRewardAdResult__(ctx, r); });
  {
    Math.random = () => 0.5;
    const d = await boot(chestRun());
    await d.click('開ける'); await d.flush();
    check('usual chest: one item, no dew, no ad guidance', saved(d).midDrops.length === 1 && !d.text().includes('宝樹の雫') && !d.text().includes('雫をもう1個'), saved(d).midDrops.map((x) => x.name));
  }
  {
    Math.random = () => 0.01;
    const d = await boot(chestRun());
    await d.click('開ける'); await d.flush();
    check('lucky chest: the item plus a dew, saved at once', saved(d).midDrops.length === 2 && saved(d).midDrops.some((x) => x.itemId === 'dew'), saved(d).midDrops.map((x) => x.name));
    check('the dew is shown and the ad guidance appears', d.text().includes('宝樹の雫') && d.text().includes('雫をもう1個もらえます'));
    await d.click('広 告 を 見 る'); await d.flush();
    check('pressing it asks for the ad (waiting state)', d.text().includes('読み込み中'));
    await adResult(d, 'dew', 'rewarded'); await d.flush();
    const dews = (saved(d).inv || []).filter((x) => x.itemId === 'dew').length;
    check('after the ad, a second dew goes into the bag and is saved', dews === 1 && !d.text().includes('雫をもう1個もらえます'), dews);
    check('the dew from the chest itself is still there to pick up', saved(d).midDrops.some((x) => x.itemId === 'dew'));
  }
  {
    // 「いいえ」を選んだら案内は閉じる。広告の回数が残っていなければ、そもそも案内しない
    Math.random = () => 0.01;
    const d = await boot(chestRun());
    await d.click('開ける'); await d.flush();
    await d.click('いいえ'); await d.flush();
    check('"no" closes the guidance and keeps the dew on the chest', !d.text().includes('雫をもう1個もらえます') && saved(d).midDrops.some((x) => x.itemId === 'dew'));
  }
  {
    Math.random = () => 0.01;
    const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10).split('-').map(Number).join('-');
    const d = await boot(chestRun(), { rewardAd: { date: today, count: 99 } });
    await d.click('開ける'); await d.flush();
    check('no ad uses left today: the dew is there but no ad guidance', saved(d).midDrops.some((x) => x.itemId === 'dew') && !d.text().includes('雫をもう1個もらえます'));
    Math.random = () => 0.5;
  }

  // ---- 「遊び方」: 3段階の数値を並べる
  {
    const d = makeDriver();
    d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, clears: 1 });
    await d.mount(); await d.flush();
    await d.click('遊び方'); await d.flush();
    await d.click('武器'); await d.flush();
    check('the guide lists the three levels of each enchant', d.text().includes('与えたダメージの2% / 4% / 8%を回復する') && d.text().includes('1.65倍 / 1.7倍 / 1.8倍') && d.text().includes('Lv.1〜3'), d.text().slice(0, 200));
  }

  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
