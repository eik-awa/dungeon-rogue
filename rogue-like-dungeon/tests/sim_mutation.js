// 敵の「変異」で難易度と武器の育ち方が変わるかを比べるシミュレーター(npm test の対象外)。
// 使い方: node sim_mutation.js [ラン数=2000]
// 敵・武器・防具・ドロップの生成は本番の kiriwatari-no-mori.jsx のモジュール直下のコードをそのまま使う。
// 戦闘は attackWith / enemyPhase の主な処理を写した簡易版(スキルは「火力・HP・防御の上乗せ」だけで近似)。
// 同じ条件で「変異なし」と「変異あり」を走らせ、到達階・章ごとの突破率・被ダメージ・武器の育ち方を比べる。
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const SRC = path.join(__dirname, '..', 'rogue-like-dungeon', 'kiriwatari-no-mori.jsx');
let src = fs.readFileSync(SRC, 'utf8');
src = src.slice(0, src.indexOf('export default function KiriwatariNoMori'));
src += '\nmodule.exports = { BALANCE, STAGES, ENEMY_BOOK, WEAPON_TYPES, ENCHANTS, ENEMY_POISON, CONSUMABLES, MUTATION, MUTATIONS, MUTATION_IDS, AFF_WEAK, AFF_RES, stageOf, floorInStage, floorNodes, makeWeapon, makeArmor, makeConsumable, makeBoss, makeEnemy, enemiesForEncounter, enchantValueOf, shellIntact, guardRedirect, makeCalledEnemy, isMut, bombPowerAt, rnd, pick };\n';
const code = babel.transformSync(src, { sourceType: 'module', presets: ['@babel/preset-react'], plugins: ['@babel/plugin-transform-modules-commonjs'], filename: 'k.jsx' }).code;
const tmp = path.join(__dirname, '.sim_module.js');
fs.writeFileSync(tmp, code);
// アイコン(lucide-react)は使わないので、何を読んでも空の部品を返す
const Module = require('module');
const origLoad = Module._load;
Module._load = function (req, ...rest) { return req === 'lucide-react' ? new Proxy({}, { get: () => () => null }) : origLoad.call(this, req, ...rest); };
const G = require(tmp);
fs.unlinkSync(tmp);
const { BALANCE, STAGES, WEAPON_TYPES, ENEMY_POISON, CONSUMABLES, MUTATION, AFF_WEAK, AFF_RES, stageOf, floorInStage, floorNodes, makeWeapon, makeArmor, makeConsumable, makeBoss, makeEnemy, enemiesForEncounter, enchantValueOf, shellIntact, guardRedirect, makeCalledEnemy, isMut, bombPowerAt, rnd, pick } = G;

// 変異の確率を 0 にすれば「変異なし」になる
const MUT_ON = { ...MUTATION };
// SIM_MUT=shell,regen のように指定すると、その変異だけを出す(どの変異が難しさに効いているかを見る用)
if (process.env.SIM_MUT) { const keep = process.env.SIM_MUT.split(','); G.MUTATION_IDS.splice(0, G.MUTATION_IDS.length, ...G.MUTATION_IDS.filter((id) => keep.includes(id))); }
// SIM_SET=regenPct=0.06,callHpK=0.5 のように指定すると、MUTATION の値を差し替えて試せる
if (process.env.SIM_SET) for (const kv of process.env.SIM_SET.split(',')) { const [k, v] = kv.split('='); MUTATION[k] = MUT_ON[k] = Number(v); }
function setMutation(on) { MUTATION.chance = on ? MUT_ON.chance : 0; MUTATION.chanceMax = on ? MUT_ON.chanceMax : 0; }

const TYPE_MULT = { dagger: 2.0, greatsword: 2.2 / 3, bow: 1.25, axe: 1.6 / 2, spear: 1.1 / 2 + 0.3, book: 2.2 / 3, staff: 1.4 / 2 + 0.2, instrument: 2.4 / 3 };
const weaponScore = (w) => w.atk * TYPE_MULT[w.type] * (1 + (w.ench ? 0.15 * (w.enchLv || 1) : 0));

function startRun(profile, startStage) {
  const floor = startStage * 10 + 1;
  const gearFloor = Math.max(1, floor + (profile.gearOfs ?? -6));
  const types = ['greatsword', 'staff', 'axe', 'bow', 'dagger', 'book', 'spear', 'instrument'];
  const weapons = [0, 1, 2].map((i) => makeWeapon(gearFloor, { type: types[(Math.random() * types.length) | 0], rarity: profile.gearRarity[i] }));
  const armor = { helm: makeArmor(gearFloor, { slot: 'helm', rarity: profile.armorRarity || 'rare' }), armor: makeArmor(gearFloor, { slot: 'armor', rarity: profile.armorRarity || 'rare' }), charm: makeArmor(gearFloor, { slot: 'charm', rarity: profile.armorRarity || 'rare' }) };
  return { floor, weapons, armor, inv: [makeConsumable('berryBig'), makeConsumable('berrySmall'), makeConsumable('berrySmall')], hp: 0, profile, st: { enchDrops: 0, mutBattles: 0, dmgTaken: 0, battles: 0, turns: 0 } };
}
const maxHp = (r) => BALANCE.playerHp + r.profile.bonusHp + Object.values(r.armor).reduce((a, x) => a + (x ? x.hp : 0), 0);
const armorDef = (r) => Math.round(Object.values(r.armor).reduce((a, x) => a + (x ? x.def : 0), 0) * (1 + r.profile.defPct));

// hitEnemy の写し
function hitEnemy(e, raw, dmgType, mult, fx) {
  if (shellIntact(e)) { e.shellBroken = true; return { dmg: 0, shell: true }; }
  const nulled = !!fx && e.mut === 'nullify';
  if (nulled) fx = null;
  let aff = 1;
  if (e.weak.includes(dmgType)) aff = fx?.weakMult || AFF_WEAK;
  else if (e.resist.includes(dmgType)) aff = fx?.resMult || AFF_RES;
  const dmg = Math.max(1, Math.round(raw * mult * aff * rnd(0.9, 1.1)) - Math.round(e.def * (1 - (fx?.pierce || 0))));
  e.hp = Math.max(0, e.hp - dmg);
  return { dmg, nulled };
}

// 期待ダメージ(行動の選択用。乱数なし)
function estHit(e, raw, dmgType, mult, fx, shellUsed) {
  if (shellIntact(e) && !shellUsed) return 0;
  if (fx && e.mut === 'nullify') fx = null;
  let aff = 1;
  if (e.weak.includes(dmgType)) aff = fx?.weakMult || AFF_WEAK;
  else if (e.resist.includes(dmgType)) aff = fx?.resMult || AFF_RES;
  return Math.max(1, Math.round(raw * mult * aff) - Math.round(e.def * (1 - (fx?.pierce || 0))));
}
function fxOf(w) {
  if (!w.ench) return null;
  const v = enchantValueOf(w);
  return { weakMult: w.ench === 'weakbane' ? AFF_WEAK + v : 0, resMult: w.ench === 'resbreak' ? AFF_RES + v : 0, pierce: w.ench === 'pierce' ? v : 0 };
}
// 武器と狙いの評価: 倒せる量 + 倒したときの価値(その敵の攻撃力)
function evalAction(r, w, aimed, enemies, atkMul) {
  const t = WEAPON_TYPES[w.type];
  const raw = w.atk * atkMul * (1 + r.profile.allDmgPct);
  const fx = fxOf(w);
  const target = guardRedirect(enemies, aimed, w.type);
  const alive = enemies.filter((e) => e.hp > 0);
  const val = (e, d) => Math.min(d, e.hp) / e.maxHp * e.atk + (d >= e.hp ? e.atk * 1.5 + (e.mut === 'caller' && !e.callDone ? e.atk : 0) : 0) + (e.mut === 'regen' ? Math.min(d, e.hp) / e.maxHp * e.atk * 0.5 : 0);
  // 殻を割るだけでも、次から本命が通るので価値がある(弱い武器で割るのが得になるよう、武器の強さに関係なく一定)
  const shellBreak = (e) => (shellIntact(e) ? e.atk * 0.3 : 0);
  let v = 0;
  if (w.type === 'dagger') { const d1 = estHit(target, raw * 1.2, t.dmgType, 1, fx); const d2 = estHit(target, raw * 1.2, t.dmgType, 1, fx, true); v = val(target, d1 + d2); }
  else if (w.type === 'book' || w.type === 'instrument') { for (const e of alive) v += val(e, estHit(e, raw, t.dmgType, 1, fx)) + shellBreak(e); if (w.type === 'instrument') v += alive.reduce((a, e) => a + e.atk * 0.2, 0); }
  else {
    const m = { greatsword: 2.2, bow: 1, axe: 1.6, spear: 1.1, staff: 1.4 }[w.type];
    v = val(target, estHit(target, raw, t.dmgType, m, fx)) + shellBreak(target);
    if (w.type === 'bow' && alive.length > 1) v += 0.5 * val(alive.find((e) => e !== target) || target, estHit(target, raw, t.dmgType, 0.5, fx) * 0.5);
    if (w.type === 'staff') v += r.hp < maxHp(r) * 0.8 ? maxHp(r) * 0.1 * 0.3 : 0;
    if (w.type === 'spear') v += target.mut === 'regen' ? target.atk * 0.5 : 0;
  }
  return v;
}

function battle(r, enemies, isBoss) {
  const p = { poison: 0, atkUp: 0, guard: false };
  const cds = {};
  const mx = maxHp(r);
  if (r.profile.startHeal) r.hp = Math.min(mx, r.hp + Math.round(mx * r.profile.startHeal)); // 呼吸法(戦闘開始時の回復)
  r.st.battles++;
  if (enemies.some((e) => e.mut)) r.st.mutBattles++;
  for (let turn = 1; turn <= 60; turn++) {
    r.st.turns++;
    const alive = () => enemies.filter((e) => e.hp > 0);
    // --- プレイヤーの行動 ---
    const heals = r.inv.filter((x) => CONSUMABLES[x.itemId]?.kind === 'heal').sort((a, b) => CONSUMABLES[a.itemId].power - CONSUMABLES[b.itemId].power);
    const charging = enemies.some((e) => e.hp > 0 && e.charge);
    if (r.hp < mx * 0.35 && heals.length) {
      const h = r.hp < mx * 0.2 ? heals[heals.length - 1] : heals[0];
      r.inv = r.inv.filter((x) => x !== h);
      r.hp = Math.min(mx, r.hp + Math.round(mx * CONSUMABLES[h.itemId].power));
    } else if (charging && r.hp < mx * 0.6) {
      p.guard = true; r.hp = Math.min(mx, r.hp + Math.round(mx * 0.05));
    } else {
      let best = null;
      for (const w of r.weapons) {
        if (!w || cds[w.id] > 0) continue;
        for (const e of alive()) { const v = evalAction(r, w, e, enemies, p.atkUp > 0 ? 1.4 : 1); if (!best || v > best.v) best = { v, w, e }; }
      }
      const bomb = r.inv.find((x) => x.itemId === 'bomb');
      if (bomb && alive().length >= 2 && (!best || bombPowerAt(r.floor) * alive().length * 0.6 > best.v * 1.3)) {
        r.inv = r.inv.filter((x) => x !== bomb);
        for (const e of alive()) e.hp = Math.max(0, e.hp - bombPowerAt(r.floor));
      } else if (best) attack(r, best.w, best.e, enemies, p, cds);
      else { p.guard = true; }
    }
    if (!alive().length) return true;
    // --- 敵のターン(enemyPhase の写し) ---
    const def = armorDef(r);
    const n0 = enemies.length;
    for (let i = 0; i < n0; i++) {
      const e = enemies[i];
      if (e.hp <= 0 || r.hp <= 0) continue;
      if (e.rare) { e.fleeIn -= 1; if (e.fleeIn <= 0) { e.hp = 0; e.fled = true; } continue; }
      if (shellIntact(e)) continue;
      if (e.mut === 'caller' && !e.callDone) {
        e.callActs = (e.callActs || 0) + 1;
        if (e.callActs >= MUTATION.callAt) {
          e.callDone = true;
          if (enemies.filter((x) => x.hp > 0).length < MUTATION.maxEnemies) { enemies.push(makeCalledEnemy(r.floor)); continue; }
        }
      }
      const weaken = e.atkDown > 0 ? 0.8 : 1;
      let dmg = Math.max(1, Math.round(e.atk * weaken * rnd(0.9, 1.1)) - def);
      if (e.boss) {
        const maxS = e.final ? 2 : 1, done = e.summoned || 0;
        if (e.hp < e.maxHp * (done === 0 ? 0.55 : 0.25) && done < maxS && alive().length < 3) {
          e.summoned = done + 1;
          for (const id of e.summons) enemies.push(makeEnemy(id, r.floor));
          continue;
        }
        if (e.charge) { dmg = Math.max(1, dmg * 2); e.charge = false; }
        else if (Math.random() < 0.28) { e.charge = true; continue; }
      }
      if (p.guard) dmg = Math.max(1, Math.round(dmg / 2));
      // 回避・不屈・踏みとどまるなどの守りのスキルを、被ダメージの割合でまとめて近似する
      if (r.profile.dr) dmg = Math.max(1, Math.round(dmg * (1 - r.profile.dr)));
      r.hp = Math.max(0, r.hp - dmg);
      r.st.dmgTaken += dmg;
      if (e.drain) e.hp = Math.min(e.maxHp, e.hp + Math.round(dmg / 2));
      if (e.poison && Math.random() < 0.4 && p.poison <= 0) p.poison = 3;
      if (e.atkDown > 0) e.atkDown -= 1;
    }
    const poisoned = new Set();
    if (r.hp > 0) {
      for (const e of enemies) {
        if (e.hp <= 0 || !(e.poisonT > 0)) continue;
        poisoned.add(e.id);
        e.hp -= Math.min(e.hp, Math.max(1, e.poisonDmg || 1)); e.poisonT -= 1;
      }
      for (const e of enemies) {
        if (!isMut(e, 'regen') || e.hp >= e.maxHp || poisoned.has(e.id)) continue;
        e.hp += Math.min(e.maxHp - e.hp, Math.max(1, Math.round(e.maxHp * MUTATION.regenPct)));
      }
    }
    if (r.hp > 0 && p.poison > 0) { const pd = Math.max(2, Math.round(mx * 0.06)); r.hp = Math.max(0, r.hp - pd); r.st.dmgTaken += pd; p.poison -= 1; }
    if (p.atkUp > 0) p.atkUp -= 1;
    p.guard = false;
    for (const k of Object.keys(cds)) { cds[k] -= 1; if (cds[k] <= 0) delete cds[k]; }
    if (r.hp <= 0) return false;
    if (!alive().length) return true;
  }
  return false; // 長引きすぎ(実質の負け)
}

function attack(r, w, aimed, enemies, p, cds) {
  const t = WEAPON_TYPES[w.type];
  const v = w.ench ? enchantValueOf(w) : 0;
  const fx = fxOf(w);
  const raw = w.atk * (p.atkUp > 0 ? 1.4 : 1) * (1 + r.profile.allDmgPct);
  const target = guardRedirect(enemies, aimed, w.type);
  let dealt = 0;
  const H = (e, m) => { const x = hitEnemy(e, raw, t.dmgType, m, fx); if (!x.nulled) dealt += x.dmg; return x; };
  if (w.type === 'dagger') { for (let i = 0; i < 2 && target.hp > 0; i++) H(target, Math.random() < 0.25 ? 1.8 : 1); }
  else if (w.type === 'greatsword') H(target, 2.2);
  else if (w.type === 'bow') { H(target, 1); const o = enemies.filter((e) => e.hp > 0 && e !== target); if (o.length) H(pick(o), 0.5); }
  else if (w.type === 'axe') { H(target, 1.6); target.def -= Math.min(2, target.def); }
  else if (w.type === 'spear') { H(target, 1.1); if (target.hp > 0) { target.poisonT = Math.max(target.poisonT || 0, ENEMY_POISON.turnsBase); target.poisonDmg = Math.max(target.poisonDmg || 0, Math.round(w.atk * (1 + r.profile.allDmgPct) * (ENEMY_POISON.pct.spear - (target.boss ? ENEMY_POISON.bossPctCut : 0)))); } }
  else if (w.type === 'book') { for (const e of enemies) if (e.hp > 0) H(e, 1); }
  else if (w.type === 'staff') { H(target, 1.4); r.hp = Math.min(maxHp(r), r.hp + Math.round(maxHp(r) * 0.1)); }
  else if (w.type === 'instrument') { for (const e of enemies) if (e.hp > 0) { H(e, 1); e.atkDown = 2; } }
  const targets = (w.type === 'book' || w.type === 'instrument' ? enemies : [target]).filter((e) => e.hp > 0 && e.mut !== 'nullify');
  if (w.ench === 'chill' && w.type !== 'instrument') for (const e of targets) if (Math.random() < v) e.atkDown = Math.max(e.atkDown || 0, 2);
  if (w.ench === 'venom' && w.type !== 'spear') for (const e of targets) { e.poisonT = Math.max(e.poisonT || 0, ENEMY_POISON.turnsBase); e.poisonDmg = Math.max(e.poisonDmg || 0, Math.max(1, Math.round(w.atk * (1 + r.profile.allDmgPct) * v))); }
  if (w.ench === 'vampire') r.hp = Math.min(maxHp(r), r.hp + Math.round(dealt * v));
  const swift = w.ench === 'swift' && t.cd > 0 && target.mut !== 'nullify' && Math.random() < v;
  if (t.cd > 0 && !swift) cds[w.id] = t.cd;
}

// rollDrops の写し(拾う判断: 武器は評価の高い3本、防具は部位ごとに強い方、消耗品は袋の上限まで)
function loot(r, enemies, floor) {
  for (const e of enemies) {
    if (e.rare) { take(r, makeWeapon(floor, { rarity: Math.random() < 0.3 ? 'legend' : 'epic' })); continue; }
    if (e.boss) { take(r, makeWeapon(floor, { rarity: 'legend' })); take(r, makeArmor(floor, { rarity: 'epic' })); continue; }
    if (e.callee) continue;
    const roll = Math.random();
    if (roll < 0.38) take(r, makeConsumable(null, floor));
    else if (roll < 0.62) { const w = makeWeapon(floor, { luck: r.profile.dropLuck, enchLuck: e.mut ? MUTATION.enchLuck : 0 }); if (w.ench) r.st.enchDrops++; take(r, w); }
    else if (roll < 0.74) take(r, makeArmor(floor, { luck: r.profile.dropLuck }));
  }
}
function take(r, it) {
  if (it.kind === 'weapon') {
    const all = [...r.weapons, it].sort((a, b) => weaponScore(b) - weaponScore(a));
    r.weapons = all.slice(0, 3);
  } else if (it.kind === 'armor') {
    const cur = r.armor[it.slot];
    if (!cur || it.def * 3 + it.hp > cur.def * 3 + cur.hp) { const before = maxHp(r); r.armor[it.slot] = it; r.hp = Math.max(1, r.hp + maxHp(r) - before); }
  } else if (r.inv.length < 10 && !['dew', 'mossHeart'].includes(it.itemId)) r.inv.push(it);
}

function playRun(profile, startStage, mutOn, endStage) {
  setMutation(mutOn);
  const r = startRun(profile, startStage);
  r.hp = maxHp(r);
  const stageLog = [];
  const lastFloor = (endStage + 1) * 10;
  while (r.floor <= lastFloor) {
    const nodes = floorNodes(r.floor);
    for (const kind of nodes) {
      if (kind === 'battle' || kind === 'boss') {
        const enemies = kind === 'boss' ? [makeBoss(r.floor)] : enemiesForEncounter(r.floor, 0, 0.04 + stageOf(r.floor) * 0.02);
        const won = battle(r, enemies, kind === 'boss');
        if (!won) return { reached: r.floor, r, stageLog };
        loot(r, enemies, r.floor);
        if (kind === 'boss') stageLog.push({ stage: stageOf(r.floor), best: Math.max(...r.weapons.map((w) => w.atk)), ench: r.weapons.filter((w) => w.ench).length, enchLv: r.weapons.reduce((a, w) => a + (w.ench ? w.enchLv : 0), 0) });
      } else if (kind === 'chest') {
        take(r, Math.random() < 0.65 ? makeWeapon(r.floor, { luck: 1.3 }) : makeArmor(r.floor, { luck: 1.3 }));
      } else if (kind === 'spring') {
        r.hp = Math.min(maxHp(r), r.hp + Math.round(maxHp(r) * 0.5));
      }
    }
    r.floor++;
  }
  return { reached: lastFloor + 1, r, stageLog };
}

// 2つの割合の差が偶然の範囲か(二項分布の標準誤差 ×2 を目安に出す)
const se2 = (p, n) => 2 * Math.sqrt(Math.max(p * (1 - p), 1e-9) / n);

// 強さのつまみ k(0〜1): 守り(被ダメージ軽減)と火力をまとめて上げる。章ごとに、変異なしの突破率が狙いの値になる k を探す
const profileOf = (k) => ({ bonusHp: 80, allDmgPct: 0.3 + k * 0.6, defPct: 0.18, dropLuck: 0.1, gearRarity: ['legend', 'epic', 'epic'], armorRarity: 'epic', gearOfs: 0, startHeal: 0.1, dr: Math.min(0.85, k * 0.85) });
function clearRate(k, c, mut, n) {
  let ok = 0;
  for (let i = 0; i < n; i++) if (playRun(profileOf(k), c, mut, c).reached > (c + 1) * 10) ok++;
  return ok / n;
}
function calibrate(c, target) {
  let lo = 0, hi = 1;
  for (let it = 0; it < 12; it++) { const mid = (lo + hi) / 2; if (clearRate(mid, c, false, 400) < target) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

function main() {
  const N = +(process.argv[2] || 2000);
  const targets = (process.env.SIM_TARGETS || '0.25,0.5,0.75').split(',').map(Number);
  const chapters = (process.env.SIM_CHAPTERS || '3,4,5,6,7,8,9').split(',').map(Number);
  console.log(`各章 ${N} ラン × 変異なし/あり。その章の入口(装備はその章相当)から次の章まで遊ぶ。`);
  console.log(`変異: 第4章 ${MUT_ON.chance * 100}% → 1章ごとに +${MUT_ON.chanceStep * 100}%(上限 ${MUT_ON.chanceMax * 100}%)`);
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  const f = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '-');
  const rows = [];
  for (const target of targets) {
    console.log(`\n■ 変異なしで、その章を ${pct(target)} 突破できる強さのプレイヤー`);
    console.log('  章   | 突破率 なし → あり (差 / 誤差の目安) | 次の章も突破 なし → あり | 1戦の被ダメ | 1戦のターン | 変異のいた戦闘 | エンチャ武器ドロップ/10階 | 章クリア時のエンチャ武器(本)');
    for (const c of chapters) {
      const k = calibrate(c, target);
      const end = Math.min(9, c + 1);
      const res = {};
      for (const mut of [false, true]) {
        const runs = [];
        for (let i = 0; i < N; i++) runs.push(playRun(profileOf(k), c, mut, end));
        const sum = (fn) => runs.reduce((a, x) => a + fn(x), 0);
        const cleared = runs.filter((x) => x.reached > (c + 1) * 10);
        res[mut] = {
          clear: cleared.length / N,
          next: end > c ? runs.filter((x) => x.reached > (end + 1) * 10).length / N : NaN,
          dmg: sum((x) => x.r.st.dmgTaken) / sum((x) => x.r.st.battles),
          turns: sum((x) => x.r.st.turns) / sum((x) => x.r.st.battles),
          mutRate: sum((x) => x.r.st.mutBattles) / sum((x) => x.r.st.battles),
          enchDrops: sum((x) => x.r.st.enchDrops) / sum((x) => Math.max(1, x.reached - c * 10)) * 10,
          enchAtClear: cleared.length ? cleared.reduce((a, x) => a + (x.stageLog.find((l) => l.stage === c)?.ench || 0), 0) / cleared.length : NaN,
        };
      }
      const a = res[false], b = res[true];
      const err = Math.sqrt(a.clear * (1 - a.clear) / N + b.clear * (1 - b.clear) / N) * 2;
      rows.push({ target, c, a, b, err });
      console.log(`  ${String(c + 1).padStart(2)}章 | ${pct(a.clear)} → ${pct(b.clear)} (${b.clear - a.clear >= 0 ? '+' : ''}${((b.clear - a.clear) * 100).toFixed(1)} / ±${(err * 100).toFixed(1)}) | ${end > c ? `${pct(a.next)} → ${pct(b.next)}` : '-'} | ${f(a.dmg)} → ${f(b.dmg)} | ${f(a.turns, 2)} → ${f(b.turns, 2)} | ${pct(b.mutRate)} | ${f(a.enchDrops, 2)} → ${f(b.enchDrops, 2)} | ${f(a.enchAtClear, 2)} → ${f(b.enchAtClear, 2)}`);
    }
  }
  if (process.env.SIM_JSON) fs.writeFileSync(process.env.SIM_JSON, JSON.stringify(rows, null, 1));
}
main();
