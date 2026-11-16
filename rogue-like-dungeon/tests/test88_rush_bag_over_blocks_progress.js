// 袋が上限(14個)を超えたままでは、ボスラッシュの「戦闘を始める」(挑戦の最初)にも「次のボスへ」(休息)にも、
// 通常の冒険の「先へ進む」(戦闘のあと)にも進めない。
// 初期アイテム5個や借りる武器が入ると上限を超えることがあるため、使うか捨てて空けてから進む。
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
const RUSH_KEY = 'kiriwatari-rush-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const todayMeta = () => ({ slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, clears: 1, bestFloor: 100 });
const berry = (i) => ({ id: `f${i}`, kind: 'item', itemId: 'berrySmall', name: '癒しの実', rarity: 'common', asset: 'berrySmall' });
const dagger = { id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 10, asset: 'dagger' };
const fillers = (n) => Array.from({ length: n }, (_, i) => berry(i));
const discardOne = async (d) => {
  const b = [...d.container.querySelectorAll('.kw-stack button')].find((x) => x.textContent.includes('捨てる') && !x.disabled);
  if (!b) throw new Error('no discard button');
  await d.click(b); await d.flush();
};
const startBtn = (d) => [...d.container.querySelectorAll('button')].find((b) => b.textContent.includes('戦闘を始める'));
const closeX = (d) => [...d.container.querySelectorAll('.kw-sheet button')].find((b) => !b.getAttribute('role') && b.querySelector('svg') && !b.textContent.trim());

async function main() {
  Math.random = () => 0.5;
  // ---- 挑戦の最初: 14個入った袋 + 初期アイテム5個 = 19個(5個超え)
  {
    const d = makeDriver();
    d.seed(SAVE_KEY, todayMeta());
    d.seed(RUN_SAVE_KEY, {
      floor: 10, node: 0, player: { hp: 20, poison: 0, atkUp: 0, guard: false }, weapons: [dagger],
      armor: { helm: null, armor: null, charm: null }, inv: fillers(14), cds: {}, lastRareSeen: 0, orbBagBonus: 0,
      rewardPhase: 'reward', drops: [],
    });
    await d.mount(); await d.flush();
    await d.click('ボ ス ラ ッ シ ュ'); await d.flush();
    await d.click('挑戦する'); await d.flush(60);
    const inv = d.readJSON(RUSH_KEY).inv.length;
    check('the rush starts with the start items on top of the full bag (over the limit)', inv > 14, inv);
    check('over the limit at the start: the start button is disabled and says how many to free', !!startBtn(d) && startBtn(d).disabled && d.text().includes('袋が上限を超えています') && d.text().includes(`あと${inv - 14}個`), d.text().slice(-200));
    await d.click(closeX(d)); await d.flush();
    check('closing the bag with the X does not start the fight either', !!startBtn(d), null);
    await d.bagTab('袋の中身');
    for (let i = 0; i < inv - 14; i++) await discardOne(d);
    check('after freeing the space the notice is gone and the button works', !d.text().includes('袋が上限を超えています') && !startBtn(d).disabled, d.text().slice(-200));
    await d.click(startBtn(d)); await d.flush();
    check('now the fight starts (the bag closes)', !startBtn(d) && !d.container.querySelector('.kw-sheet'));
  }
  // ---- 休息: 14個 + 次のボスの武器を借りる1個 = 15個(1個超え)
  {
    const d = makeDriver();
    d.seed(SAVE_KEY, todayMeta());
    d.seed(RUSH_KEY, {
      floor: 10, node: 0, nodes: ['boss'], player: { hp: 20, poison: 0, atkUp: 0, guard: false }, weapons: [dagger],
      armor: { helm: null, armor: null, charm: null }, inv: fillers(14), cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn: 2,
      rush: { idx: 0, atk: 0.08, dr: 0, hp: 0, choices: ['atk', 'dr', 'hp'], picked: true, pickedId: 'atk', taken: { atk: 1 }, wave: 1 },
      rushPhase: 'rushRest',
    });
    await d.mount(); await d.flush();
    await d.click('ボスラッシュ 再開'); await d.flush();
    const next = () => [...d.container.querySelectorAll('button')].find((b) => b.textContent.includes('次のボスへ'));
    check('rest: a full bag plus the borrowed weapon is over the limit: the next-boss button is disabled with a notice', !!next() && next().disabled && d.text().includes('あと1個'), d.text().slice(-200));
    await d.click(next()).catch(() => {}); await d.flush();
    check('and pressing it does nothing (still resting)', d.readJSON(RUSH_KEY).rush.idx === 0 && d.readJSON(RUSH_KEY).rushPhase === 'rushRest');
    await d.click('袋・装備'); await d.flush();
    await d.bagTab('袋の中身');
    await discardOne(d);
    await d.click(closeX(d)); await d.flush();
    check('after discarding one item the button is enabled', !next().disabled && !d.text().includes('袋が上限を超えています'));
    await d.click(next()); await d.flush(60);
    const st = d.readJSON(RUSH_KEY);
    check('and the next boss starts with the borrowed weapon in the bag (exactly at the limit)', st.rush.idx === 1 && st.inv.length === 14 && st.inv.some((x) => x.loaned), [st.rush.idx, st.inv.length]);
  }
  // ---- 通常の冒険: 戦闘のあとの「先へ進む」も、上限を超えていると進めない
  {
    const mk = (n) => ({
      floor: 10, node: 0, nodes: ['battle', 'battle'], player: { hp: 20, poison: 0, atkUp: 0, guard: false }, weapons: [dagger],
      armor: { helm: null, armor: null, charm: null }, inv: fillers(n), cds: {}, lastRareSeen: 0, orbBagBonus: 0,
      rewardPhase: 'reward', drops: [],
    });
    const boot2 = async (n) => {
      const d = makeDriver();
      d.seed(SAVE_KEY, { ...todayMeta(), bestFloor: 10 });
      d.seed(RUN_SAVE_KEY, mk(n));
      await d.mount(); await d.flush();
      await d.click('再開'); await d.flush();
      return d;
    };
    const go = (d) => [...d.container.querySelectorAll('button')].find((b) => b.textContent.includes('先へ進む'));
    let d = await boot2(17);
    check('normal run: 17 items (3 over): the proceed button is disabled with the count', !!go(d) && go(d).disabled && d.text().includes('あと3個'), d.text().slice(-160));
    await d.click(go(d)).catch(() => {}); await d.flush();
    check('and pressing it does nothing (still on the reward screen, same node)', d.readJSON(RUN_SAVE_KEY).node === 0 && !!go(d));
    await d.click('袋・装備'); await d.flush();
    await d.bagTab('袋の中身');
    for (let i = 0; i < 3; i++) await discardOne(d);
    await d.click(closeX(d)); await d.flush();
    check('after freeing 3 slots it is enabled and the notice is gone', !go(d).disabled && !d.text().includes('袋が上限を超えています'));
    await d.click(go(d)); await d.flush(60);
    check('and the next fight starts', d.readJSON(RUN_SAVE_KEY).node === 1, d.readJSON(RUN_SAVE_KEY).node);
    d = await boot2(14);
    check('exactly at the limit: no block', !go(d).disabled && !d.text().includes('袋が上限を超えています'));
  }
  // ---- 通常の冒険の最初: 継承品が多くて、初期アイテムを足すと上限を超えるときは、戦闘を始められない
  {
    const d = makeDriver();
    d.seed(SAVE_KEY, { ...todayMeta(), slots: 20, inherited: fillers(16).map((x) => ({ ...x, id: `h${x.id}` })) });
    await d.mount(); await d.flush();
    await d.click('森 へ 入 る'); await d.flush();
    await d.click('踏 み 入 れ る'); await d.flush();
    const inv = d.container.textContent.match(/袋の中身\s*(\d+)\/14/);
    check('normal start: inherited items plus the starting items go over the limit', !!inv && +inv[1] > 14, inv && inv[1]);
    check('the start button is disabled, closing with the X does not start either', !!startBtn(d) && startBtn(d).disabled && d.text().includes('袋が上限を超えています'));
    await d.click(closeX(d)); await d.flush();
    check('still in the gear prep after the X', !!startBtn(d));
  }
  // ---- 余裕があれば、これまでどおり進める
  {
    const d = makeDriver();
    d.seed(SAVE_KEY, todayMeta());
    d.seed(RUSH_KEY, {
      floor: 10, node: 0, nodes: ['boss'], player: { hp: 20, poison: 0, atkUp: 0, guard: false }, weapons: [dagger],
      armor: { helm: null, armor: null, charm: null }, inv: fillers(5), cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn: 2,
      rush: { idx: 0, atk: 0.08, dr: 0, hp: 0, choices: ['atk', 'dr', 'hp'], picked: true, pickedId: 'atk', taken: { atk: 1 }, wave: 1 },
      rushPhase: 'rushRest',
    });
    await d.mount(); await d.flush();
    await d.click('ボスラッシュ 再開'); await d.flush();
    const next = [...d.container.querySelectorAll('button')].find((b) => b.textContent.includes('次のボスへ'));
    check('plenty of room: no notice and the button works', !next.disabled && !d.text().includes('袋が上限を超えています'));
  }
  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
