// ボスラッシュのボスの妨害技:
//   - 武器封じ: 武器1本が、次の2ターン使えない(敵ターンの終わりにクールダウンが1減るので、3を入れる)
//   - 鞄封じ: 2ターン、戦闘中に袋が開けない / 防御封じ: 2ターン、防御できない
//   - ボスは debuffEvery(3)ターンごとに、持っている妨害を順に使う。最終ボス(写し身の旅人)は武器ごとの攻撃に添えて、全種を使ってくる
const { makeDriver } = require('./drive');
const RUSH_KEY = 'kiriwatari-rush-save';
const SAVE_KEY = 'kiriwatari-forest-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };

const foe = (extra = {}) => ({
  id: 'B', bookId: 'slime', name: 'B', asset: 'slime', hp: 90000, maxHp: 90000, atk: 1, def: 0,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: true, summoned: 99, summons: [], ...extra,
});
const wp = (id, type = 'dagger') => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'common', atk: 5, asset: type });
const meta = () => ({ slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, clears: 1, bonusHp: 900 });
const rush = (enemies, turn, over = {}, idx = 0, wave = 1) => ({
  floor: 10, node: 0, nodes: ['boss'], player: { hp: 900, poison: 0, atkUp: 0, guard: false },
  weapons: [wp('甲'), wp('乙')], armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn,
  enemies, rush: { idx, atk: 0, dr: 0, hp: 0, choices: null, picked: false, taken: {}, wave }, rushPhase: 'battle', ...over,
});
async function boot(run) {
  const d = makeDriver();
  d.seed(SAVE_KEY, meta()); d.seed(RUSH_KEY, run);
  await d.mount(); await d.flush();
  await d.click('ボスラッシュ 再開'); await d.flush();
  return d;
}
const st = (d) => d.readJSON(RUSH_KEY);
// 使える武器で1回攻撃して、敵ターンが終わるまで待つ(敵は1体なので、すぐに撃つ)
async function act(d) {
  const before = st(d).turn || 1;
  const b = d.findAllButtonsContaining('試験の').find((x) => !x.disabled);
  await d.click(b); await d.flush();
  await d.flushUntil(() => (st(d).turn || 1) > before, { tries: 200 });
  await d.flush(); await d.flush();
}
const button = (d, label) => [...d.container.querySelectorAll('button')].find((b) => b.textContent.includes(label));

async function main() {
  Math.random = () => 0.5;
  {
    // 武器封じ: 3ターン目の敵ターンで掛かり、その後の2ターン使えない
    const d = await boot(rush([foe({ debuffs: ['seal'] })], 3));
    await act(d);
    let r = st(d);
    const sealed = Object.keys(r.cds).filter((k) => r.cds[k] > 0);
    check('turn 3: one weapon is sealed (cooldown 2 left on the next player turn)', sealed.length === 1 && r.cds[sealed[0]] === 2, r.cds);
    check('the sealed weapon cannot be used', d.findAllButtonsContaining('試験の').filter((b) => !b.disabled).length === 1);
    await act(d); // turn 4: the other weapon
    r = st(d);
    check('turn 5: still sealed (1 left), so it is blocked for two player turns in all', r.cds[sealed[0]] === 1, r.cds);
    await act(d); // turn 5
    r = st(d);
    check('then it is free again', !(r.cds[sealed[0]] > 0), r.cds);
  }
  {
    // 鞄封じ
    const d = await boot(rush([foe({ debuffs: ['bag'] })], 3));
    check('before: the bag button works', !button(d, '袋 (').disabled);
    await act(d);
    check('bag sealed: the bag button is disabled and says so, with a status tag', button(d, '封印中') && button(d, '袋')?.disabled && d.text().includes('鞄封じ'), d.text().slice(-120));
    check('the seal is 2 player turns (counter 2 on the next turn)', st(d).player.bagSealT === 2, st(d).player);
    await act(d);
    check('1 turn later: still sealed (1)', st(d).player.bagSealT === 1);
    await act(d);
    check('2 turns later: the bag opens again', !st(d).player.bagSealT && !button(d, '袋 (').disabled);
  }
  {
    // 防御封じ
    const d = await boot(rush([foe({ debuffs: ['guard'] })], 3));
    await act(d);
    const g = button(d, '防御');
    check('guard sealed: the guard button is disabled with the remaining turns', g.disabled && g.textContent.includes('封印中') && d.text().includes('防御封じ'), g.textContent);
    await act(d); await act(d);
    check('and it comes back after two turns', !button(d, '防御').disabled && !st(d).player.guardSealT);
  }
  {
    // 妨害は3ターンごと(1・2ターン目には出ない)
    const d = await boot(rush([foe({ debuffs: ['bag'] })], 1));
    await act(d);
    check('turn 1: no debuff yet', !st(d).player.bagSealT);
  }
  {
    // 実際に生成されるボスは、その番号の妨害を持つ
    const d = makeDriver();
    d.seed(SAVE_KEY, meta());
    await d.mount(); await d.flush();
    await d.click('ボ ス ラ ッ シ ュ'); await d.flush();
    await d.click('挑戦する'); await d.flush(60);
    const boss = st(d).enemies.find((e) => e.boss);
    check('the first boss carries its debuff list (weapon seal)', JSON.stringify(boss.debuffs) === JSON.stringify(['seal']), boss.debuffs);
  }
  {
    // 最終ボス: 武器ごとの攻撃に妨害が付く(短剣=鞄封じ / 大剣=防御封じ / 弓=武器封じ / 槍=毒 / 楽器=火力低下)
    const trav = (extra = {}) => foe({ id: 'T', name: '写し身の旅人', secret: true, pattern: 'mimic', hp: 900000, maxHp: 900000, atk: 1, ...extra });
    const run = (turn) => rush([trav()], turn, {}, 10, 3);
    let d = await boot(run(1)); await act(d);
    check('traveler, dagger turn: bag sealed', st(d).player.bagSealT > 0, st(d).player);
    d = await boot(run(2)); await act(d);
    check('traveler, greatsword turn: guard sealed', st(d).player.guardSealT > 0, st(d).player);
    d = await boot(run(3)); await act(d);
    check('traveler, bow turn: a weapon is sealed', Object.values(st(d).cds).some((v) => v > 0), st(d).cds);
    d = await boot(run(5)); await act(d);
    check('traveler, spear turn: poisoned', st(d).player.poison > 0, st(d).player);
    d = await boot(run(8)); await act(d);
    check('traveler, instrument turn: firepower down', st(d).player.weakT > 0, st(d).player);
  }
  {
    // 中断して再開しても、封じは消えない(アプリを閉じて解く抜け道を作らない)
    const d = await boot(rush([foe({ debuffs: ['bag'] })], 3));
    await act(d);
    const d2 = makeDriver();
    d2.seed(SAVE_KEY, meta()); d2.seed(RUSH_KEY, st(d));
    await d2.mount(); await d2.flush();
    await d2.click('ボスラッシュ 再開'); await d2.flush();
    check('the bag seal survives closing the app and resuming', !!button(d2, '封印中') && button(d2, '袋')?.disabled, d2.text().slice(-120));
  }
  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
