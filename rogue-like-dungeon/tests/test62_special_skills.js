// 特別スキル: 第6章到達で解放される群と、第9章到達でのみ解放される強力な群。
// 効果(胞子ターン/火力、果実リジェネ、踏みとどまる意志)と、解放条件の判定を確認する。
const fs = require('fs'), path = require('path');
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function run(over = {}) {
  return {
    floor: 1, node: 0, player: { hp: 200, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 10, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [
      { id: 's1', kind: 'item', itemId: 'spore', name: '力の胞子', rarity: 'common', asset: 'spore' },
      { id: 'b1', kind: 'item', itemId: 'berryBig', name: '生命の果実', rarity: 'common', asset: 'berryBig' },
    ],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    enemies: [{ id: 'e1', bookId: 'x', name: '敵イチ', hp: 9000, maxHp: 9000, atk: 3, def: 0, weak: [], resist: [], asset: 'slime' }],
    ...over,
  };
}
async function boot(skills, runOver, meta = {}) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills, everHadWeapon: true, ...meta });
  d.seed(RUN_SAVE_KEY, run(runOver));
  await d.mount(); await d.click('再開'); await d.flush(600);
  return d;
}
async function useFromBag(d, name) {
  await d.click('袋'); await d.flush();
  const cell = Array.from(d.container.querySelectorAll('button.kw-cell')).find((b) => b.textContent.includes(name));
  await d.click(cell);
  await d.flushUntil(() => d.container.querySelector('.kw-log').textContent.includes('ターン2'), { tries: 80 });
  await d.flush(100);
}

async function main() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'rogue-like-dungeon', 'kiriwatari-no-mori.jsx'), 'utf8');
  const ok = [];
  const check = (label, v) => { console.log(label, v); ok.push(!!v); };

  // 1. 胞子: 持続+2ターン(3->5)、火力+60%
  let d = await boot({ sporeTurns: true, sporePower: true }, {});
  await useFromBag(d, '力の胞子');
  let r = d.readJSON(RUN_SAVE_KEY);
  // 使用ターンに敵ターンで1消費 => 3+2+1-1 = 5
  check('[1] spore lasts 4 turns with 胞子の余韻:', r.player.atkUp === 4);
  check('[1b] HUD shows 攻+50%:', d.text().includes('攻+50%'));

  // 2. 果実: リジェネ
  d = await boot({ fruitRegen: true }, { player: { hp: 20, poison: 0, atkUp: 0, guard: false } });
  await useFromBag(d, '生命の果実');
  r = d.readJSON(RUN_SAVE_KEY);
  const logs = d.container.querySelector('.kw-log').textContent;
  check('[2] fruit regen ticks in the enemy phase:', logs.includes('実りの加護でHPを') && r.player.regen === 2);

  // 3. 踏みとどまる意志: HP>=50% で致死ダメージを1で耐える
  d = await boot({ endure: true }, { player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    enemies: [{ id: 'e1', bookId: 'x', name: '強敵', hp: 9000, maxHp: 9000, atk: 9999, def: 0, weak: [], resist: [], asset: 'slime' }] });
  await d.click(d.findButtonContaining('試験の短剣'));
  await d.flushUntil(() => d.container.querySelector('.kw-log').textContent.includes('ターン2'), { tries: 80 });
  await d.flush(100);
  const lg = d.container.querySelector('.kw-log').textContent;
  check('[3] endure leaves HP 1 instead of dying (HP>=50%):', lg.includes('踏みとどまった') && d.readJSON(RUN_SAVE_KEY).player.hp === 1);

  // 4. 解放条件の判定(ソースの skillUnlocked と同じ規則)
  const eng = src.match(/function skillUnlocked[\s\S]*?\n}\n/)[0];
  const stageOf = (f) => Math.min(9, Math.floor((f - 1) / 10));
  const skillUnlocked = eval('(' + eng.replace('function skillUnlocked', 'function') + ')');
  const a = { unlock: { stage: 6 } }, b = { unlock: { stage: 9 } };
  check('[4a] stage-6 skills locked at floor 50, open at 51:', !skillUnlocked(a, { bestFloor: 50 }) && skillUnlocked(a, { bestFloor: 51 }));
  check('[4b] stage-9 skills locked at floor 80, open at 81:', !skillUnlocked(b, { bestFloor: 80 }) && skillUnlocked(b, { bestFloor: 81 }));

  // 5. UI/購入: 未解放のスキルは購入できない(buySkill が unlock を見る)
  d = await boot({}, {}, { dewBank: 99, bestFloor: 10, clears: 0 });
  await d.click('袋'); await d.flush();
  await d.click(d.findButtonContaining('スキルツリー')); await d.flush();
  const rows = Array.from(d.container.querySelectorAll('[role="button"]'));
  const locked = rows.filter((x) => x.textContent.includes('???'));
  check('[5] special skills appear as ??? before unlocking:', locked.length >= 8);
  const cats = { specialHp: '生存', specialDodge: '生存', lastStand2: '生存', endure: '生存', titanSeal: '戦闘拡張', sporeTurns: '転生', sporePower: '転生', fruitRegen: '転生' };
  const inTrees = Object.entries(cats).every(([id, c]) => new RegExp('id: "' + id + '"[^\\n]*category: "' + c + '"').test(src));
  check('[6] special skills are branches of the existing trees (no separate 特別 category):', inTrees && !/category: "特別"/.test(src));

  const pass = ok.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
