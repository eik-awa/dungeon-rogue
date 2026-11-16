// Feature (user-requested): ボスラッシュ(百層踏破後の挑戦)と、踏破者向けの追加スキルツリー。
//   - title button only after a 100-floor clear; its own save slot (never touches the normal run save)
//   - gear = the player's current inherited items (not consumed), 10 bosses in a row, escorts increase per boss: 1,1,2,2,3,4,4,5,5,6
//   - after each boss: rest (heal + pick exactly one buff), then the next boss
//   - dying ends the attempt (no revive offer, no inheritance, no death count); 1-3 crystals by bosses beaten
//   - the rush-only skills affect the rush only; the "踏破" tab is hidden until the first clear
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
const RUSH_KEY = 'kiriwatari-rush-save';

const enemy = (id, extra = {}) => ({
  id, bookId: 'slime', name: id, asset: 'slime', hp: 5000, maxHp: 5000, atk: 0, def: 10,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false, ...extra,
});
const bossOf = (id, extra = {}) => enemy(id, { boss: true, summoned: 99, summons: [], ...extra });
const weapon = (id, type, atk) => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'common', atk, asset: type });
const meta = (extra = {}) => ({ slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, clears: 1, ...extra });
const rushRun = (idx, over = {}) => ({
  floor: idx * 10 + 10, node: 0, nodes: ['boss'],
  player: { hp: 600, poison: 0, atkUp: 0, guard: false },
  weapons: [weapon('剣', 'greatsword', 100), weapon('本', 'book', 100)],
  armor: { helm: null, armor: null, charm: null }, inv: [],
  cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn: 2,
  rush: { idx, atk: 0, dr: 0, hp: 0, choices: null, picked: false }, rushPhase: 'battle',
  ...over,
});
const BUFF_LABEL = { atk: '闘気', dr: '鉄壁', hp: '生命の泉', heal: '癒しの風', berry: '生命の果実', bomb: '森火の実' };

async function boot(m, { rush, run } = {}) {
  const d = makeDriver();
  d.seed(SAVE_KEY, m);
  if (rush) d.seed(RUSH_KEY, rush);
  if (run) d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.flush();
  return d;
}
const readRush = (d) => d.readJSON(RUSH_KEY);
async function attack(d, name, stop) {
  await d.click(name);
  await d.flush();
  await d.flushUntil(stop, { tries: 100 });
  await d.flush(); await d.flush();
}

async function main() {
  Math.random = () => 0.5;
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // [A] the title button appears only after a 100-floor clear
  {
    const d0 = await boot(meta({ clears: 0 }));
    check('no rush button before the first clear', !d0.text().includes('ボ ス ラ ッ シ ュ'));
    const d1 = await boot(meta({ clears: 1 }));
    check('rush button after the first clear', d1.text().includes('ボ ス ラ ッ シ ュ'));
  }

  // [B] start: own save slot, normal run untouched, fixed gear, boss + 1 escort at the first boss
  {
    const normal = { floor: 33, node: 0, player: { hp: 50, poison: 0, atkUp: 0, guard: false }, weapons: [weapon('通常', 'dagger', 10)],
      armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies: [enemy('N')] };
    const inh = [
      { id: 'iw1', kind: 'weapon', type: 'greatsword', name: '継承の大剣', rarity: 'legend', atk: 300, asset: 'greatsword' },
      { id: 'iw2', kind: 'weapon', type: 'bow', name: '継承の弓', rarity: 'legend', atk: 200, asset: 'bow' },
      { id: 'ia1', kind: 'armor', slot: 'armor', name: '継承の鎧', rarity: 'legend', def: 30, hp: 100, asset: 'armor' },
    ];
    const d = await boot(meta({ inherited: inh }), { run: normal });
    await d.click('ボ ス ラ ッ シ ュ');
    await d.flush();
    check('intro is short: the rules live in 遊び方, not on the start screen', !d.text().includes('取り巻きが増えて') && !d.text().includes('核') && d.text().includes('遊び方'));
    await d.click('挑戦する');
    await d.flush(50);
    const r = readRush(d);
    check('rush run saved under its own key', !!r && r.rush && r.rush.idx === 0 && r.floor === 10, r && [r.floor, r.rush]);
    check('first fight: boss + 1 escort', r && r.enemies.length === 2 && r.enemies[0].boss && !r.enemies[1].boss, r && r.enemies.map((e) => e.boss));
    check('boss never summons (summoned cap)', r && r.enemies[0].summoned === 99);
    check('a suspended adventure exists: its current weapon is used', r && r.weapons.filter(Boolean).map((w) => w.name).join() === '試験の通常', r && r.weapons.map((w) => w && w.name));
    check('the suspended adventure is NOT consumed', d.readJSON(RUN_SAVE_KEY).weapons[0].name === '試験の通常' && d.readJSON(SAVE_KEY).inherited.length === 3);
    check('the weapon prep screen opens before the first fight', d.text().includes('戦闘準備'));
    check('consumables: the adventure bag + rush items', r && r.inv.length === 0 + 5, r && r.inv.length);

    // no suspended adventure: the inherited items are used (and are not consumed)
    const d2 = await boot(meta({ inherited: inh }));
    await d2.click('ボ ス ラ ッ シ ュ'); await d2.flush();
    await d2.click('挑戦する'); await d2.flush(50);
    const r2 = readRush(d2);
    check('no adventure: gear comes from the inherited items', r2.weapons.filter(Boolean).map((w) => w.name).join() === '継承の大剣,継承の弓' && r2.armor.armor && r2.armor.armor.name === '継承の鎧', r2.weapons.map((w) => w && w.name));
    check('the inherited items are NOT consumed', d2.readJSON(SAVE_KEY).inherited.length === 3);
    check('consumables: normal starter kit + rush items + a loaner for the missing core weapon', r2.inv.length === 3 + 5 + 1 && r2.inv.some((x) => x.loaned && x.type === 'dagger'), r2.inv.length);
    check('the normal run save is untouched', d.readJSON(RUN_SAVE_KEY).floor === 33 && d.readJSON(RUN_SAVE_KEY).weapons[0].name === '試験の通常');
    check('HUD shows the rush header', d.text().includes('ボスラッシュ') && d.text().includes('1 / 10'));
  }

  // [C] escorts increase boss by boss
  {
    const expected = [1, 1, 2, 2, 3, 4, 4, 5, 5, 6];
    const got = [];
    for (let idx = 0; idx < 10; idx++) {
      const d = await boot(meta(), { rush: rushRun(idx) });
      await d.click('ボスラッシュ 再開');
      await d.flush(50);
      const r = readRush(d);
      got.push(r.enemies.length - 1);
    }
    check('escort counts 1,1,2,2,3,4,4,5,5,6', JSON.stringify(got) === JSON.stringify(expected), got);
  }

  // [D] beating a boss -> rest; exactly one buff; next boss with more escorts and refreshed gear
  {
    const run = rushRun(2, { enemies: [bossOf('B', { hp: 1, def: 0 }), enemy('E', { hp: 1, def: 0 })], player: { hp: 30, poison: 0, atkUp: 0, guard: false } });
    const d = await boot(meta(), { rush: run });
    await d.click('ボスラッシュ 再開');
    await d.flush();
    await attack(d, '試験の本', () => (readRush(d) || {}).rushPhase === 'rushRest');
    let r = readRush(d);
    check('rest phase saved', r && r.rushPhase === 'rushRest' && Array.isArray(r.rush.choices) && r.rush.choices.length === 3, r && r.rush);
    check('rest screen is shown', d.text().includes('束 の 間 の 休 息'));
    check('rest healed the player (35% of max = 25 of 72)', r.player.hp === 55, r.player.hp);
    check('"next" is locked until a buff is picked', d.findButtonContaining('次のボスへ') === null);
    const ids = r.rush.choices;
    const a = d.findAllButtonsContaining(BUFF_LABEL[ids[0]])[0];
    const b = d.findAllButtonsContaining(BUFF_LABEL[ids[1]])[0];
    await d.raceClicks(a, b);
    await d.flush(60);
    r = readRush(d);
    check('only one buff is applied when two are tapped at once', r.rush.picked === true &&
      ['atk', 'dr', 'hp'].filter((k) => ids.includes(k) && r.rush[k] > 0).length <= 1, r.rush);
    check('"next" unlocks after the pick', d.findButtonContaining('次のボスへ') !== null);
    const pid = r.rush.pickedId;
    check('the chosen buff is remembered (pickedId / taken)', ids.includes(pid) && r.rush.taken && r.rush.taken[pid] === 1, [pid, r.rush.taken]);
    check('the chosen buff is marked as selected, and what was gained is shown', d.text().includes('✓ 選択済み') && d.text().includes('得たもの:' + BUFF_LABEL[pid]));
    await d.click('これまでの強化を見る');
    await d.flush();
    check('the buff list opens: picked one lit with ×1, the others "未選択"', d.text().includes('強 化 一 覧') && d.text().includes('✓ ×1') && d.text().includes('未選択'));
    await d.click('閉じる');
    await d.flush();
    check('the buff list closes', !d.text().includes('強 化 一 覧'));
    await d.click('次のボスへ');
    await d.flush(60);
    r = readRush(d);
    check('next boss: idx 3, floor 40, 1 boss + 2 escorts', r.rush.idx === 3 && r.floor === 40 && r.enemies.length === 3 && r.rushPhase === 'battle', [r.rush.idx, r.floor, r.enemies.length]);
    check('taken buffs carry over and the next rest starts unpicked', r.rush.taken[pid] === 1 && r.rush.pickedId === null && r.rush.picked === false, r.rush);
    check('battle HUD has the buff list button, and it opens during a fight', d.findButtonContaining('強化一覧(1)') !== null);
    await d.click('強化一覧(1)');
    await d.flush();
    check('buff list shown during battle', d.text().includes('強 化 一 覧') && d.text().includes('✓ ×1'));
    await d.click('閉じる');
    await d.flush();
    check('header counter is a single nowrap line', /ボスラッシュ.*4 \/ 10/.test(d.text()) && d.container.querySelector('.kw-floor span[style*="nowrap"]') !== null);
    check('gear carried over unchanged to the next boss', r.weapons.filter(Boolean).map((w) => w.name).join() === '試験の剣,試験の本', r.weapons.map((w) => w && w.name));
    check('the normal save slot was never created', d.readJSON(RUN_SAVE_KEY) === null);
  }

  // [D2] many enemies: boss in the middle, escorts split to the left and right; the field scroll resets for the next fight
  {
    const escorts = (n) => Array.from({ length: n }, (_, i) => enemy('E' + i, { hp: 1, def: 0 }));
    const run = rushRun(5, { enemies: [bossOf('B', { hp: 1, def: 0 }), ...escorts(4)], player: { hp: 600, poison: 0, atkUp: 0, guard: false } });
    const d = await boot(meta(), { rush: run });
    await d.click('ボスラッシュ 再開');
    await d.flush();
    const split = d.container.querySelector('.kw-field-inner.bosscenter');
    check('4+ enemies: the boss is in the middle column', !!split && split.querySelectorAll('.kw-bc-boss .kw-enemy.boss').length === 1 && split.children[1].classList.contains('kw-bc-boss'));
    const sides = split ? [...split.querySelectorAll('.kw-bc-side')] : [];
    check('4 escorts are split 2 + 2 on the left and right of the boss', sides.length === 2 && sides.every((s) => s.querySelectorAll('.kw-enemy').length === 2), sides.map((s) => s.querySelectorAll('.kw-enemy').length));
    const run9 = rushRun(8, { enemies: [bossOf('B'), ...escorts(5)] });
    const d9 = await boot(meta(), { rush: run9 });
    await d9.click('ボスラッシュ 再開');
    await d9.flush();
    const sides9 = [...d9.container.querySelectorAll('.kw-field-inner.bosscenter .kw-bc-side')].map((s) => s.querySelectorAll('.kw-enemy').length);
    check('5 escorts: 3 on the left, 2 on the right', sides9.join() === '3,2', sides9);
    // scroll position is reset when moving to the next boss
    const dn = await boot(meta(), { rush: rushRun(2, { rushPhase: 'rushRest', enemies: undefined,
      rush: { idx: 2, atk: 0, dr: 0, hp: 0, choices: ['atk', 'dr', 'hp'], picked: true, pickedId: 'atk', taken: { atk: 1 } } }) });
    await dn.click('ボスラッシュ 再開');
    await dn.flush();
    const f2 = dn.container.querySelector('.kw-field');
    f2.scrollTop = 150;
    await dn.click('次のボスへ');
    await dn.flush(60);
    check('scroll is back at the top after moving on to the next fight', dn.container.querySelector('.kw-field').scrollTop === 0, dn.container.querySelector('.kw-field').scrollTop);
  }

  // [E] resume at the rest screen (killed during the rest)
  {
    const run = rushRun(4, { rushPhase: 'rushRest', enemies: undefined,
      rush: { idx: 4, atk: 0.08, dr: 0, hp: 0, choices: ['atk', 'dr', 'hp'], picked: false } });
    const d = await boot(meta(), { rush: run });
    check('title offers the rush resume (5/10)', d.text().includes('ボスラッシュ 再開') && d.text().includes('5/10'));
    await d.click('ボスラッシュ 再開');
    await d.flush();
    check('rest screen restored with the choices', d.text().includes('束 の 間 の 休 息') && d.text().includes('闘気') && d.text().includes('鉄壁'));
    check('HUD has no 闘気/鉄壁 tags (they squeezed the HP bar); only the 強化一覧 button', !d.container.querySelector('.kw-hud .kw-status')?.textContent.includes('闘気') && !d.container.querySelector('.kw-hud .kw-status')?.textContent.includes('鉄壁') && d.text().includes('強化一覧'));
  }

  // [E2] resume at the rest screen after the pick: the chosen buff is still shown as selected
  {
    const run = rushRun(4, { rushPhase: 'rushRest', enemies: undefined,
      rush: { idx: 4, atk: 0.16, dr: 0, hp: 0, choices: ['atk', 'dr', 'hp'], picked: true, pickedId: 'atk', taken: { atk: 2 } } });
    const d = await boot(meta(), { rush: run });
    await d.click('ボスラッシュ 再開');
    await d.flush();
    check('resumed rest keeps the selected mark and the gain note', d.text().includes('✓ 選択済み') && d.text().includes('得たもの:闘気(火力 累計 +16%)'));
    await d.click('これまでの強化を見る');
    await d.flush();
    check('list shows ×2 for 闘気', d.text().includes('✓ ×2'));
  }

  // [E3] a stale rush (old gear snapshot) can be restarted from the title with the current adventure's gear
  {
    const old = rushRun(2, { weapons: [weapon('旧', 'dagger', 5)], enemies: [bossOf('B')] });
    const cur = { floor: 33, node: 0, player: { hp: 50, poison: 0, atkUp: 0, guard: false }, weapons: [weapon('新', 'greatsword', 300)],
      armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies: [enemy('N')] };
    const d = await boot(meta(), { rush: old, run: cur });
    check('stale rush offers resume plus a restart button', d.text().includes('ボスラッシュ 再開') && d.findButtonContaining('最初からやり直す') !== null);
    await d.click('最初からやり直す');
    await d.flush();
    check('restart asks for confirmation (nothing discarded yet)', d.text().includes('ボスラッシュをやり直す') && readRush(d).rush.idx === 2);
    await d.click('← キャンセル');
    await d.flush();
    check('cancel keeps the old rush', !d.text().includes('ボスラッシュをやり直す') && readRush(d).rush.idx === 2);
    await d.click('最初からやり直す');
    await d.flush();
    await d.click(d.findAllButtonsContaining('やり直す').find((el) => el.textContent.trim() === 'やり直す'));
    await d.flush(60);
    const r = readRush(d);
    check('restart: boss 1 with the current adventure gear (not the old snapshot)', r && r.rush.idx === 0 && r.weapons.filter(Boolean).map((w) => w.name).join() === '試験の新', r && r.weapons.map((w) => w && w.name));
    check('restart: the normal run save is untouched', d.readJSON(RUN_SAVE_KEY).floor === 33);
  }

  // [F] dying ends the attempt: crystals by bosses beaten, no revive offer, no death count, save cleared
  {
    const normal = { floor: 33, node: 0, player: { hp: 50, poison: 0, atkUp: 0, guard: false }, weapons: [weapon('通常', 'dagger', 10)],
      armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies: [enemy('N')] };
    const run = rushRun(2, { player: { hp: 5, poison: 0, atkUp: 0, guard: false }, enemies: [bossOf('B', { hp: 99999, atk: 500 })] });
    const d = await boot(meta({ dewBank: 7, deaths: 3 }), { rush: run, run: normal });
    await d.click('ボスラッシュ 再開');
    await d.flush();
    await attack(d, '試験の剣', () => d.text().includes('広告を見て復活'));
    check('a revive offer comes first (once per attempt, via an ad)', d.text().includes('広告を見て復活') && d.text().includes('この挑戦で'));
    await d.click('あきらめる');
    await d.flush();
    const m = d.readJSON(SAVE_KEY);
    check('after declining: result screen', d.text().includes('力 尽 き た'));
    check('2 bosses beaten -> 1 crystal (7 -> 8)', m.dewBank === 8, m.dewBank);
    check('best record saved, no clear counted', m.rushBest === 2 && !m.rushClears, [m.rushBest, m.rushClears]);
    check('death count untouched', m.deaths === 3, m.deaths);
    check('rush save cleared', !readRush(d));
    check('normal run save untouched', d.readJSON(RUN_SAVE_KEY).floor === 33);
    await d.click('タイトルへ戻る');
    await d.flush();
    check('back at the title with no rush resume', d.text().includes('ボ ス ラ ッ シ ュ') && !d.text().includes('ボスラッシュ 再開'));
  }

  // [G] beating the 11th (secret) fight: the top tier, 3 crystals
  {
    const secretBoss = { id: 'S', bookId: 'shadowSelf', name: '写し身の旅人', asset: 'shadowSelf', hp: 1, maxHp: 1, atk: 0, def: 0,
      weak: [], resist: [], boss: true, summoned: 99, summons: [], secret: true, pattern: 'mimic', atkDown: 0, rare: false };
    const run = rushRun(10, { enemies: [secretBoss], rush: { idx: 10, atk: 0, dr: 0, hp: 0, choices: null, picked: false, wave: 3 } });
    const d = await boot(meta({ dewBank: 0 }), { rush: run });
    await d.click('ボスラッシュ 再開');
    await d.flush();
    await attack(d, '試験の剣', () => d.text().includes('完 全 踏 破'));
    const m = d.readJSON(SAVE_KEY);
    check('clear screen', d.text().includes('完 全 踏 破'));
    check('clearing everything gives the maximum: 3 crystals', m.dewBank === 3, m.dewBank);
    check('clear recorded (ten + secret)', m.rushClears === 1 && m.rushSecretClears === 1 && m.rushBest === 11, [m.rushClears, m.rushSecretClears, m.rushBest]);
    check('normal clears count untouched', m.clears === 1, m.clears);
    check('rush save cleared', !readRush(d));
  }

  // [H] rush skills / buffs affect the rush only
  {
    // greatsword atk 100, enemy def 10: no bonus = round(100*2.2)-10 = 210; +8% = round(108*2.2)-10 = 228; +8%+10% buff = round(118*2.2)-10 = 250
    const normalRun = { floor: 5, node: 0, player: { hp: 900, poison: 0, atkUp: 0, guard: false }, weapons: [weapon('剣', 'greatsword', 100)],
      armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies: [enemy('N', { hp: 5000 })] };
    const dn = makeDriver();
    dn.seed(SAVE_KEY, meta({ skills: { rushAtk1: true } })); dn.seed(RUN_SAVE_KEY, normalRun);
    await dn.mount(); await dn.flush();
    await dn.click('再開'); await dn.flush();
    await dn.click('試験の剣'); await dn.flush();
    await dn.click(dn.container.querySelectorAll('.kw-enemy')[0]);
    await dn.flushUntil(() => (dn.readJSON(RUN_SAVE_KEY).turn || 1) > 1, { tries: 100 });
    check('normal run ignores the rush skill (210)', dn.readJSON(RUN_SAVE_KEY).enemies[0].hp === 5000 - 210, dn.readJSON(RUN_SAVE_KEY).enemies[0].hp);

    const run = rushRun(0, { enemies: [bossOf('B', { hp: 5000 })], rush: { idx: 0, atk: 0.10, dr: 0, hp: 0, choices: null, picked: false } });
    const d = await boot(meta({ skills: { rushAtk1: true } }), { rush: run });
    await d.click('ボスラッシュ 再開'); await d.flush();
    await d.click('試験の剣'); await d.flush();
    await d.click(d.container.querySelectorAll('.kw-enemy')[0]);
    await d.flushUntil(() => (readRush(d).turn || 1) > 2, { tries: 100 });
    check('rush: +8% skill and +10% buff apply (250)', readRush(d).enemies[0].hp === 5000 - 250, readRush(d).enemies[0].hp);

    const dh = await boot(meta({ skills: { rushHp1: true } }), { rush: rushRun(0, { enemies: [bossOf('B')], player: { hp: 72, poison: 0, atkUp: 0, guard: false } }) });
    await dh.click('ボスラッシュ 再開'); await dh.flush();
    check('rush: max HP +10% (72 -> 79)', dh.text().includes('72 / 79'), dh.container.querySelector('.kw-num') && dh.container.querySelector('.kw-num').textContent);
  }

  // [I] the 踏破 tab: hidden before the first clear, shown after; buying works
  {
    const d0 = await boot(meta({ clears: 0, dewBank: 50 }));
    await d0.click('スキルツリー'); await d0.flush();
    check('no 踏破 tab before the first clear', d0.findAllButtonsContaining('踏破').length === 0 && !d0.text().includes('覇気の目覚め'));

    const d = await boot(meta({ clears: 1, dewBank: 20 }));
    await d.click('スキルツリー'); await d.flush();
    check('normal tab shown first (no rush skill names)', !d.text().includes('覇気の目覚め'));
    const tab = d.findAllButtonsContaining('踏破').find((b) => b.textContent.trim() === '踏破');
    check('踏破 tab exists after the first clear', !!tab);
    await d.click(tab); await d.flush();
    check('rush tab lists the skills and the notice', d.text().includes('覇気の目覚め') && d.text().includes('ボスラッシュの中だけ'));
    const row = Array.from(d.container.querySelectorAll('[role="button"]')).find((el) => el.textContent.includes('覇気の目覚め'));
    await d.click(row); await d.flush();
    await d.click('この結晶で習得する'); await d.flush();
    const m = d.readJSON(SAVE_KEY);
    check('bought: skill owned, 9 crystals spent (rush skills cost about 3x the normal ones)', m.skills && m.skills.rushAtk1 === true && m.dewBank === 11, [m.skills, m.dewBank]);
  }

  // [J] pausing a rush keeps it in its own slot
  {
    const d = await boot(meta(), { rush: rushRun(1, { enemies: [bossOf('B'), enemy('E')] }) });
    await d.click('ボスラッシュ 再開'); await d.flush();
    await d.click('タイトルへ'); await d.flush();
    await d.click('中断してタイトルへ'); await d.flush(60);
    check('paused: the title offers the rush resume, not the normal one', d.text().includes('ボスラッシュ 再開') && !d.text().includes('層）'));
    check('rush save kept, normal slot empty', !!readRush(d) && d.readJSON(RUN_SAVE_KEY) === null);
    await d.click('ボスラッシュ 再開'); await d.flush();
    check('resumed into the same fight', d.container.querySelectorAll('.kw-enemy').length === 2);
  }

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
