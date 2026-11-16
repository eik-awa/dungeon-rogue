// ボスラッシュ: 1日3回まで(日本時間の0時にリセット)。挑戦すると、倒した数に応じて精の結晶が1〜3個もらえる。
// 結果画面の広告で2倍。踏破者向けのスキルなど、結晶以外の「手に入るもの」は増やさない。
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUSH_KEY = 'kiriwatari-rush-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const todayKey = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10).split('-').map(Number).join('-');
const yesterdayKey = () => new Date(Date.now() + 9 * 3600_000 - 24 * 3600_000).toISOString().slice(0, 10).split('-').map(Number).join('-');
const meta = (extra = {}) => ({ slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, clears: 1, dewBank: 0, ...extra });
const adResult = (d, ctx, r) => act(async () => { d.env.window.__onRewardAdResult__(ctx, r); });

async function title(m, rush) {
  const d = makeDriver();
  d.seed(SAVE_KEY, m);
  if (rush) d.seed(RUSH_KEY, rush);
  await d.mount();
  await d.flush();
  return d;
}
// idx 体を倒したところで力尽きる挑戦(復活の広告は断る)
const fallenRun = (idx) => ({
  floor: Math.min(100, idx * 10 + 10), node: 0, nodes: ['boss'],
  player: { hp: 5, poison: 0, atkUp: 0, guard: false },
  weapons: [{ id: 'w1', kind: 'weapon', type: 'greatsword', name: '試験の剣', rarity: 'common', atk: 1, asset: 'greatsword' }],
  armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn: 2,
  enemies: [{ id: 'B', bookId: 'slime', name: 'B', asset: 'slime', hp: 99999, maxHp: 99999, atk: 500, def: 10, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: true, summoned: 99, summons: [] }],
  rush: { idx, atk: 0, dr: 0, hp: 0, choices: null, picked: false, taken: {}, wave: 1 }, rushPhase: 'battle',
});
async function crystalsAfterFalling(idx) {
  const d = await title(meta(), fallenRun(idx));
  await d.click('ボスラッシュ 再開'); await d.flush();
  // ボスは大技の予告をしてから撃ってくることがあるので、復活の案内が出るまで攻撃を続ける
  for (let i = 0; i < 4 && !d.text().includes('広告を見て復活'); i++) {
    await d.click('試験の剣'); await d.flush();
    await d.flushUntil(() => d.text().includes('広告を見て復活'), { tries: 60 });
  }
  await d.click('あきらめる'); await d.flush();
  return { d, got: d.readJSON(SAVE_KEY).dewBank };
}

async function main() {
  Math.random = () => 0.5;
  // ---- 結晶: 倒した数に応じて 1 / 2 / 3 個(最大3個)
  for (const [idx, want] of [[0, 1], [2, 1], [3, 2], [6, 2], [7, 3], [10, 3]]) {
    const { got } = await crystalsAfterFalling(idx);
    check(`${idx} bosses beaten -> ${want} crystal(s)`, got === want, got);
  }
  {
    // 10体を倒しても、最後の戦い(11体目)で力尽きたら、全ボス撃破の記録にはならない
    const { d } = await crystalsAfterFalling(10);
    const m = d.readJSON(SAVE_KEY);
    check('falling at the final fight: best 10 is kept, but it does not count as clearing all bosses', m.rushBest === 10 && !m.rushClears && !m.rushSecretClears, [m.rushBest, m.rushClears, m.rushSecretClears]);
  }
  {
    // 広告で2倍(結果画面)
    const { d } = await crystalsAfterFalling(7);
    check('the result screen offers the 2x ad with the exact bonus', !!d.findButtonContaining('結晶を2倍にする(+3個)'));
    await d.click('結晶を2倍にする'); await d.flush();
    await adResult(d, 'rushCrystal', 'rewarded'); await d.flush();
    check('after the ad the total is doubled (3 -> 6)', d.readJSON(SAVE_KEY).dewBank === 6, d.readJSON(SAVE_KEY).dewBank);
    check('the 2x button is gone after claiming', !d.findButtonContaining('結晶を2倍にする'));
  }

  // ---- 1日の挑戦回数: 3回まで
  {
    const d = await title(meta());
    await d.click('ボ ス ラ ッ シ ュ'); await d.flush();
    check('fresh day: 3 attempts left, with the reward range shown', d.text().includes('本日あと3/3回') && d.text().includes('1〜3個'));
    check('no skill / extra-reward promises in the intro', ![...d.container.querySelectorAll('.kw-sheet')].some((el) => el.textContent.includes('スキル')));
    await d.click('挑戦する'); await d.flush();
    const m = d.readJSON(SAVE_KEY);
    check('starting uses one attempt (today, count 1)', m.rushDaily && m.rushDaily.date === todayKey() && m.rushDaily.count === 1, m.rushDaily);
  }
  {
    const d = await title(meta({ rushDaily: { date: todayKey(), count: 2 } }));
    await d.click('ボ ス ラ ッ シ ュ'); await d.flush();
    check('2 used: 1 attempt left', d.text().includes('本日あと1/3回'));
    await d.click('挑戦する'); await d.flush();
    check('the 3rd attempt starts', d.readJSON(SAVE_KEY).rushDaily.count === 3 && !!d.readJSON(RUSH_KEY));
  }
  {
    const d = await title(meta({ rushDaily: { date: todayKey(), count: 3 } }));
    await d.click('ボ ス ラ ッ シ ュ'); await d.flush();
    const btn = [...d.container.querySelectorAll('button')].find((b) => b.textContent.includes('挑戦する'));
    check('limit reached: the start button is disabled and the intro says so', btn && btn.disabled && d.text().includes('本日の挑戦は終わりました'), d.text().slice(0, 200));
    await act(async () => { btn.dispatchEvent(new d.env.window.MouseEvent('click', { bubbles: true, cancelable: true })); });
    await d.flush();
    check('and nothing starts (no rush save, count unchanged)', !d.readJSON(RUSH_KEY) && d.readJSON(SAVE_KEY).rushDaily.count === 3);
  }
  {
    const d = await title(meta({ rushDaily: { date: yesterdayKey(), count: 3 } }));
    await d.click('ボ ス ラ ッ シ ュ'); await d.flush();
    check("yesterday's count does not carry over (3/3 again)", d.text().includes('本日あと3/3回'));
  }
  {
    // 連打しても1回分しか使わない
    const d = await title(meta());
    await d.click('ボ ス ラ ッ シ ュ'); await d.flush();
    await d.doubleClickRace('挑戦する'); await d.flush();
    check('double-tapping the start button uses only one attempt', d.readJSON(SAVE_KEY).rushDaily.count === 1, d.readJSON(SAVE_KEY).rushDaily);
  }
  {
    // 中断した挑戦の再開は、回数を使わない。最初からやり直すと1回使う
    const d = await title(meta({ rushDaily: { date: todayKey(), count: 1 } }), fallenRun(2));
    await d.click('ボスラッシュ 再開'); await d.flush();
    check('resuming a paused attempt does not use another one', d.readJSON(SAVE_KEY).rushDaily.count === 1);
    await d.click('タイトルへ'); await d.flush();
    await d.click('中断してタイトルへ'); await d.flush(60);
    await d.click('最初からやり直す'); await d.flush();
    check('the restart warning mentions the attempt count', d.text().includes('本日の挑戦を1回使います') && d.text().includes('あと2/3回'));
    await d.click([...d.container.querySelectorAll('.kw-sheet button')].find((b) => b.textContent === 'やり直す')); await d.flush();
    check('restarting from scratch uses one attempt (1 -> 2)', d.readJSON(SAVE_KEY).rushDaily.count === 2, d.readJSON(SAVE_KEY).rushDaily);
  }
  {
    const d = await title(meta({ rushDaily: { date: todayKey(), count: 3 } }), fallenRun(2));
    await d.click('最初からやり直す'); await d.flush();
    const btn = [...d.container.querySelectorAll('button')].find((b) => b.textContent === 'やり直す');
    check('restart is disabled when no attempts are left (the paused run stays)', btn && btn.disabled && !!d.readJSON(RUSH_KEY));
  }

  // ---- 遊び方にも書いてある
  {
    const d = await title(meta());
    await d.click('遊び方'); await d.flush();
    await d.click('⑥ ボスラッシュ'); await d.flush();
    check('the guide explains the 1-3 crystals, the 2x ad and the 3 per day', d.text().includes('1〜3個') && d.text().includes('結晶が2倍') && d.text().includes('1日3回'));
  }
  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
