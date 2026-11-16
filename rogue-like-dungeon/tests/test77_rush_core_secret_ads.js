// ボスラッシュの拡張:
//   - 核: 指定の武器種で突くと露出(通常ダメージ)。閉じている間は他の武器のダメージが大きく減る
//   - 核の武器を持っていなければ、次のボスへ進むときに借り物が袋に入る
//   - シークレット戦: 武器の分身(2組)→写し身の旅人。武器ごとの攻撃を使ってくる
//   - 広告(任意): 復活(1挑戦に1度) / 結果で結晶を追加
//   - レア要素(敵・ドロップ)は出ない
const { makeDriver } = require('./drive');
const { act } = require('react-dom/test-utils');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUSH_KEY = 'kiriwatari-rush-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

const enemy = (id, extra = {}) => ({
  id, bookId: 'slime', name: id, asset: 'slime', hp: 5000, maxHp: 5000, atk: 0, def: 10,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: false, ...extra,
});
const bossOf = (id, extra = {}) => enemy(id, { boss: true, summoned: 99, summons: [], ...extra });
const weapon = (id, type, atk) => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'common', atk, asset: type });
const meta = (extra = {}) => ({ slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, clears: 1, ...extra });
const rushRun = (idx, over = {}) => ({
  floor: Math.min(100, idx * 10 + 10), node: 0, nodes: ['boss'],
  player: { hp: 600, poison: 0, atkUp: 0, guard: false },
  weapons: [weapon('剣', 'greatsword', 100)],
  armor: { helm: null, armor: null, charm: null }, inv: [],
  cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn: 2,
  rush: { idx, atk: 0, dr: 0, hp: 0, choices: null, picked: false, taken: {}, wave: 1 }, rushPhase: 'battle',
  ...over,
});
async function boot(m, rush, run) {
  const d = makeDriver();
  d.seed(SAVE_KEY, m);
  d.seed(RUSH_KEY, rush);
  if (run) d.seed(RUN_SAVE_KEY, run);
  await d.mount();
  await d.flush();
  await d.click('ボスラッシュ 再開');
  await d.flush();
  return d;
}
const readRush = (d) => d.readJSON(RUSH_KEY);
const adResult = (d, ctx, r) => act(async () => { d.env.window.__onRewardAdResult__(ctx, r); });
async function hit(d, name, targetIdx = 0) {
  const before = readRush(d).turn || 1;
  await d.click(name);
  await d.flush();
  const enemies = d.container.querySelectorAll('.kw-enemy');
  if (enemies.length > 1 || targetIdx) await d.click(enemies[targetIdx]);
  else if (d.container.querySelectorAll('.kw-enemy').length === 1) { /* single target: the weapon fires at once */ }
  await d.flushUntil(() => (readRush(d).turn || 1) > before, { tries: 100 });
  await d.flush(); await d.flush();
}

async function main() {
  Math.random = () => 0.5;
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // [A] core: closed = x0.4 for other weapons; the core weapon opens it; open = full damage for the next turns
  {
    const run = rushRun(3, {
      weapons: [weapon('短剣', 'dagger', 100), weapon('杖', 'staff', 100), null],
      enemies: [bossOf('B', { hp: 5000, maxHp: 5000, def: 10, core: 'staff', coreOpen: 0 })],
    });
    const d = await boot(meta(), run);
    check('the core is a hidden stat: the card never names the core weapon', !d.text().includes('核') && !d.text().includes('守り崩れ'));
    await hit(d, '試験の短剣');
    // dagger x2 hits: each round(100*0.4)-10 = 30
    check('closed core: other weapons do 40% (2 x 30)', readRush(d).enemies[0].hp === 5000 - 60, readRush(d).enemies[0].hp);
    await hit(d, '試験の杖');
    // staff 1.4 x core-hit 1.5: round(210)-10 = 200, and it opens the core
    check('the core weapon hits for 1.5x (200) and opens the core', readRush(d).enemies[0].hp === 5000 - 60 - 200 && readRush(d).enemies[0].coreOpen > 0, readRush(d).enemies[0]);
    check('the card shows 守り崩れ only while exposed (no 核, no weapon name)', d.text().includes('守り崩れ') && !d.text().includes('核'));
    await hit(d, '試験の短剣');
    // open: 2 x (100-10) = 180
    check('exposed core: every weapon does full damage (2 x 90)', readRush(d).enemies[0].hp === 5000 - 60 - 200 - 180, readRush(d).enemies[0].hp);
  }

  // [A2] rush skills: weapon mastery, core leak (two steps), core open duration
  {
    const run = rushRun(0, { enemies: [bossOf('B', { hp: 5000, maxHp: 5000, def: 10 })] });
    const d = await boot(meta({ skills: { rushAtk1: true, rushWpn_greatsword: true } }), run);
    await hit(d, '試験の剣');
    // 100 x (1 + 0.08 + 0.15) = 123 x 2.2 = 270.6 -> 271 - 10
    check('weapon mastery skill: +15% for that weapon type only (greatsword)', readRush(d).enemies[0].hp === 5000 - 261, readRush(d).enemies[0].hp);
    const run2 = rushRun(0, { enemies: [bossOf('B', { hp: 5000, maxHp: 5000, def: 10, core: 'staff', coreOpen: 0 })] });
    const d2 = await boot(meta({ skills: { rushAtk1: true, rushAtk2: true, rushBreak: true, rushCoreLeak: true } }), run2);
    await hit(d2, '試験の剣');
    // raw 100 x 1.18 = 118; 118 x 2.2 x 0.55 = 142.78 -> 143 - def 10
    check('core leak skill: closed-core damage is 55% instead of 40%', readRush(d2).enemies[0].hp === 5000 - (Math.round(118 * 2.2 * 0.55) - 10), readRush(d2).enemies[0].hp);
    const d2b = await boot(meta({ skills: { rushAtk1: true, rushAtk2: true, rushCoreLeak: true, rushCoreLeak2: true } }), run2);
    await hit(d2b, '試験の剣');
    check('second core leak skill: 70%', readRush(d2b).enemies[0].hp === 5000 - (Math.round(118 * 2.2 * 0.7) - 10), readRush(d2b).enemies[0].hp);
    const run3 = rushRun(0, { weapons: [weapon('杖', 'staff', 100), weapon('剣', 'greatsword', 100)], enemies: [bossOf('B', { hp: 5000, maxHp: 5000, def: 10, core: 'staff', coreOpen: 0 })] });
    const d3 = await boot(meta({ skills: { rushAtk1: true, rushAtk2: true, rushBreak: true, rushCoreOpen: true } }), run3);
    await hit(d3, '試験の杖');
    check('core open skill: exposed for one turn longer (2 -> 3 turns left after the first turn)', readRush(d3).enemies[0].coreOpen === 3, readRush(d3).enemies[0].coreOpen);
    const m = d.readJSON(SAVE_KEY);
    check('owned rush skills stay in the save', m.skills.rushAtk1 === true && m.skills.rushWpn_greatsword === true, m.skills);
  }

  // [B] loaner: no weapon of the next boss's core type -> a loaner joins the bag when moving on
  {
    const rest = rushRun(2, {
      rushPhase: 'rushRest', enemies: undefined,
      weapons: [weapon('短剣', 'dagger', 100), weapon('剣', 'greatsword', 100)],
      rush: { idx: 2, atk: 0, dr: 0, hp: 0, choices: ['atk', 'dr', 'hp'], picked: true, pickedId: 'atk', taken: { atk: 1 }, wave: 1 },
    });
    const d = await boot(meta(), rest);
    check('the rest screen does not reveal the next core', !d.text().includes('次のボスの核'));
    await d.click('次のボスへ');
    await d.flush(60);
    const r = readRush(d);
    const loan = r.inv.find((x) => x.loaned);
    check('a loaner staff joined the bag, at 90% of the average attack', loan && loan.type === 'staff' && loan.atk === 90 && loan.rarity === 'common', loan);
    check('the loaner is plain (no rare item is handed out)', r.inv.every((x) => x.kind !== 'weapon' || x.rarity === 'common'));
    check('the new boss carries the core', r.enemies[0].core === 'staff');
    check('no rare enemy and no loot in the rush', r.enemies.every((e) => !e.rare) && !(r.drops && r.drops.length));
  }
  {
    const rest = rushRun(2, {
      rushPhase: 'rushRest', enemies: undefined, inv: [weapon('杖', 'staff', 50)],
      rush: { idx: 2, atk: 0, dr: 0, hp: 0, choices: ['atk', 'dr', 'hp'], picked: true, pickedId: 'atk', taken: { atk: 1 }, wave: 1 },
    });
    const d = await boot(meta(), rest);
    await d.click('次のボスへ');
    await d.flush(60);
    check('no loaner when the core weapon is already in the bag', !readRush(d).inv.some((x) => x.loaned));
  }

  // [C] secret fight: the traveler stands in the middle with 4 / 4 / 8 weapon shadows. At 60% HP he heals a little and
  //     changes weapons; at 30% he is fully healed and eight shadows rise, stronger.
  {
    const traveler = (hp, wave) => enemy('T', { name: '写し身の旅人', asset: 'shadowSelf', boss: true, summoned: 99, summons: [], secret: true, pattern: 'mimic', hp, maxHp: 1000, atk: 100, def: 0 });
    const clone = (id, type) => enemy(id, { name: `${type}の分身`, hp: 99999, maxHp: 99999, atk: 0, clone: true, respawn: true, pattern: type, core: type, coreOpen: 0 });
    const clones1 = () => [clone('c1', 'dagger'), clone('c2', 'greatsword'), clone('c3', 'axe'), clone('c4', 'spear')];
    const mk = (hp, wave, foes) => rushRun(10, {
      player: { hp: 900, poison: 0, atkUp: 0, guard: false },
      weapons: [weapon('剣', 'dagger', 125), weapon('剣b', 'dagger', 125)], // the book shadow may seal one of them
      enemies: [traveler(hp), ...foes],
      rush: { idx: 10, atk: 0, dr: 0, hp: 0, choices: null, picked: false, taken: {}, wave },
    });
    
    const d = await boot(meta({ bonusHp: 900 }), mk(1000, 1, clones1()));
    check('wave 1: the traveler in the middle, two shadows on each side (4 weapon types)', !!d.container.querySelector('.kw-bc-boss')?.textContent.includes('写し身の旅人') && [...d.container.querySelectorAll('.kw-bc-side')].map((x) => x.querySelectorAll('.kw-enemy').length).join() === '2,2' && d.text().includes('最終戦'));
    // strike the traveler with whichever dagger is ready (a dagger hits twice: 2 x 125 = 250)
    const strike = async (dr) => {
      const before = readRush(dr).turn || 1;
      await dr.click(dr.findAllButtonsContaining('試験の剣').find((b) => !b.disabled)); await dr.flush();
      await dr.click(dr.container.querySelector('[data-enemy-id="T"]'));
      await dr.flushUntil(() => (readRush(dr).turn || 1) > before || !readRush(dr), { tries: 160 });
      await dr.flush(); await dr.flush();
    };
    const hitTraveler = () => strike(d);
    await hitTraveler(); // 1000 -> 750 (75%): no change yet
    let r = readRush(d);
    check('above 60%: still wave 1 with the same four shadows', r.rush.wave === 1 && r.enemies.length === 5 && r.enemies.find((e) => e.secret).hp === 750, [r.rush.wave, r.enemies.find((e) => e.secret).hp]);
    await hitTraveler(); // 750 -> 500 (50%): wave 2 = heal 35% (350) and four other weapons (the staff shadow may add its own small heal)
    r = readRush(d);
    const t2 = r.enemies.find((e) => e.secret);
    check('at 60%: healed by 35% of max and the weapons change (bow / book / staff / instrument)', r.rush.wave === 2 && t2.hp >= 500 + 350 && t2.hp <= 1000 && r.enemies.filter((e) => e.clone).map((e) => e.pattern).join() === 'bow,book,staff,instrument', [r.rush.wave, t2.hp, r.enemies.map((e) => e.name)]);
    check('the traveler keeps standing in the middle with a fresh set of shadows', d.container.querySelector('.kw-bc-boss')?.textContent.includes('写し身の旅人') && r.enemies.filter((e) => e.clone).every((e) => e.hp === e.maxHp), [r.rushPhase, r.player, r.enemies.map((e) => e.hp + '/' + e.maxHp)]);
    // reseed the save with the traveler at 34% instead of playing three more turns
    const d2 = await boot(meta({ bonusHp: 900 }), { ...mk(340, 2, [clone('c5', 'bow'), clone('c6', 'book'), clone('c7', 'staff'), clone('c8', 'instrument')]) });
    const before2 = readRush(d2).enemies.find((e) => e.secret).atk;
    await strike(d2); // 340 -> 90 (9%): wave 3 = full heal and eight stronger shadows
    r = readRush(d2);
    const t3 = r.enemies.find((e) => e.secret);
    check('at 30%: fully healed, eight shadows (all weapon types)', r.rush.wave === 3 && t3.hp === t3.maxHp && r.enemies.filter((e) => e.clone).length === 8 && new Set(r.enemies.filter((e) => e.clone).map((e) => e.pattern)).size === 8, [r.rush.wave, t3.hp, r.enemies.length]);
    check('wave 3 is stronger: the traveler and the shadows hit harder', t3.atk > before2 && r.enemies.find((e) => e.clone).atk > 0, [before2, t3.atk]);
    check('eight shadows: four on each side of the traveler', [...d2.container.querySelectorAll('.kw-bc-side')].map((x) => x.querySelectorAll('.kw-enemy').length).join() === '4,4', [...d2.container.querySelectorAll('.kw-bc-side')].map((x) => x.querySelectorAll('.kw-enemy').length));
    // a single blow that would kill the traveler before the last wave does not end the fight
    const d3 = await boot(meta({ bonusHp: 900 }), mk(100, 1, clones1()));
    await strike(d3);
    r = readRush(d3);
    check('a killing blow before the last wave skips to wave 3 with a full heal instead of ending the fight', !!r && r.rush.wave === 3 && r.enemies.find((e) => e.secret).hp === r.enemies.find((e) => e.secret).maxHp, r && [r.rush.wave, r.enemies.find((e) => e.secret).hp]);
  }
  {
    // the last wave: beating the traveler ends the fight, even with shadows still standing
    const run = rushRun(10, {
      weapons: [weapon('剣', 'dagger', 125), weapon('剣b', 'dagger', 125)],
      enemies: [enemy('T', { name: '写し身の旅人', boss: true, summoned: 99, summons: [], secret: true, pattern: 'mimic', hp: 1, maxHp: 1000, atk: 0, def: 0 }),
        enemy('c1', { name: '短剣の分身', clone: true, respawn: true, pattern: 'dagger', core: 'dagger', hp: 99999, maxHp: 99999 })],
      rush: { idx: 10, atk: 0, dr: 0, hp: 0, choices: null, picked: false, taken: {}, wave: 3 },
    });
    const d = await boot(meta(), run);
    await d.click('試験の剣'); await d.flush();
    await d.click(d.container.querySelector('[data-enemy-id="T"]'));
    await d.flushUntil(() => d.text().includes('完 全 踏 破') || !readRush(d), { tries: 160 });
    await d.flush();
    check('beating the traveler in wave 3 clears the fight and the shadows vanish with him', d.text().includes('完 全 踏 破') || !readRush(d));
  }

  // [D] the other traveler uses the weapons' attacks in turn (turn 1 = dagger: two hits of 60%)
  {
    const boss = bossOf('S', { name: '写し身の旅人', hp: 99999, maxHp: 99999, atk: 100, def: 0, secret: true, pattern: 'mimic', core: null, coreOpen: 0 });
    const run = rushRun(10, { turn: 1, weapons: [weapon('剣', 'greatsword', 100)], enemies: [boss], rush: { idx: 10, atk: 0, dr: 0, hp: 0, choices: null, picked: false, taken: {}, wave: 3 } });
    const d = await boot(meta({ bonusHp: 900 }), run); // 1ターンの被ダメージ上限(最大HPの60%)に当たらない大きさにする
    const hp0 = readRush(d).player.hp;
    await hit(d, '試験の剣');
    check('turn 1 mimics the dagger: two hits of 60 (-120)', hp0 - readRush(d).player.hp === 120, hp0 - readRush(d).player.hp);
  }

  // [E] revive ad: once per attempt, optional
  {
    const run = rushRun(2, { weapons: [weapon('短剣', 'dagger', 100)], player: { hp: 5, poison: 0, atkUp: 0, guard: false }, enemies: [bossOf('B', { hp: 99999, atk: 500 })] });
    const d = await boot(meta({ dewBank: 0 }), run);
    await hit(d, '試験の短剣').catch(() => {});
    await d.flushUntil(() => d.text().includes('広告を見て復活'), { tries: 60 });
    check('revive offer after falling', d.text().includes('広告を見て復活') && d.text().includes('60%'));
    await d.click('広告を見て復活');
    await d.flush();
    check('loading state while the ad request is in flight', d.text().includes('広告を読み込み中'));
    await adResult(d, 'rushRevive', 'rewarded');
    await d.flush();
    const r = readRush(d);
    check('revived at half HP, fight continues, one use consumed', r && r.player.hp > 0 && r.rush.reviveUsed === true && d.readJSON(SAVE_KEY).rewardAd.count === 1, [r && r.player.hp, r && r.rush.reviveUsed]);
    check('back in battle (no offer)', !d.text().includes('広告を見て復活'));
    await hit(d, '試験の短剣').catch(() => {});
    await d.flushUntil(() => d.text().includes('力 尽 き た'), { tries: 80 });
    check('a second fall ends the attempt (no second offer)', d.text().includes('力 尽 き た') && !d.text().includes('広告を見て復活'));
    // [G] crystal ad on the result screen
    const before = d.readJSON(SAVE_KEY).dewBank;
    check('result offers the crystal ad (double)', !!d.findButtonContaining('結晶を2倍にする'));
    await d.click('結晶を2倍にする');
    await d.flush();
    await adResult(d, 'rushCrystal', 'rewarded');
    await d.flush();
    const after = d.readJSON(SAVE_KEY);
    check('crystal ad: doubles the base (1 -> +1), one more use consumed', after.dewBank === before + 1 && after.rewardAd.count === 2, [before, after.dewBank, after.rewardAd]);
    check('the button is gone after claiming', !d.findButtonContaining('結晶を2倍にする'));
  }
  {
    // declined/failed revive: nothing changes, nothing consumed
    const run = rushRun(2, { weapons: [weapon('短剣', 'dagger', 100)], player: { hp: 5, poison: 0, atkUp: 0, guard: false }, enemies: [bossOf('B', { hp: 99999, atk: 500 })] });
    const d = await boot(meta({ dewBank: 0 }), run);
    await hit(d, '試験の短剣').catch(() => {});
    await d.flushUntil(() => d.text().includes('広告を見て復活'), { tries: 60 });
    await d.click('広告を見て復活');
    await d.flush();
    await adResult(d, 'rushRevive', 'nofill');
    await d.flush();
    check('failed ad: still on the offer, no use consumed', d.text().includes('広告を見て復活') && !(d.readJSON(SAVE_KEY).rewardAd && d.readJSON(SAVE_KEY).rewardAd.count));
    // closing the app on the offer screen: it comes back as the offer
    const d2 = makeDriver();
    d2.seed(SAVE_KEY, meta()); d2.seed(RUSH_KEY, readRush(d));
    await d2.mount(); await d2.flush();
    await d2.click('ボスラッシュ 再開'); await d2.flush();
    check('resume while on the offer restores the offer', d2.text().includes('広告を見て復活'));
  }

  // [F] rest: one pick only. There is no ad to pick a second one.
  {
    const rest = rushRun(2, {
      rushPhase: 'rushRest', enemies: undefined,
      rush: { idx: 2, atk: 0.08, dr: 0, hp: 0, choices: ['atk', 'dr', 'hp'], picked: true, pickedId: 'atk', taken: { atk: 1 }, wave: 1 },
    });
    const d = await boot(meta(), rest);
    check('after the pick there is no extra-pick ad button, and the next boss is reachable', !d.findButtonContaining('もう1つ強化を選ぶ') && !d.text().includes('もう1つ') && !!d.findButtonContaining('次のボスへ'));
    // a stray ad callback for the removed context changes nothing
    await adResult(d, 'rushPick', 'rewarded');
    await d.flush();
    const r = readRush(d);
    check('a stray rushPick callback grants nothing (still picked, no extra use)', r.rush.picked === true && Object.values(r.rush.taken).reduce((a, b) => a + b, 0) === 1 && !(d.readJSON(SAVE_KEY).rewardAd && d.readJSON(SAVE_KEY).rewardAd.count), r.rush);
  }

  // [H] the secret boss is hidden from the normal progress dots until it is reached
  {
    const d = await boot(meta(), rushRun(0, { enemies: [bossOf('B')] }));
    check('before the final fight: 10 dots, no hint of an 11th', d.container.querySelectorAll('.kw-progress .kw-node').length === 10);
    const d2 = await boot(meta(), rushRun(10, { enemies: [enemy('x', { clone: true, pattern: 'dagger', core: 'dagger', hp: 100, maxHp: 100 })], rush: { idx: 10, atk: 0, dr: 0, hp: 0, choices: null, picked: false, taken: {}, wave: 1 } }));
    check('in the final fight: an 11th dot', d2.container.querySelectorAll('.kw-progress .kw-node').length === 11);
  }

  const ok = results.every(Boolean);
  console.log(ok ? 'PASS' : `FAIL (${results.filter((x) => !x).length} failed)`);
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
