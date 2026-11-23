// Firebase 計測: エンチャントの使用率
//   - 章ボスを倒したときの weapon_boss_kill に、武器ごとのエンチャント(ench / ench_lv)を添える。付いていない武器は "none" / 0
//   - ボスラッシュでボスを倒したときは、エンチャント付きの武器だけ rush_ench_boss_kill を送る
//   - 既存の rush_boss_kill(何体目まで倒したか)はそのまま送られる
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
const RUSH_KEY = 'kiriwatari-rush-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };
const wp = (id, type, extra = {}) => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'legend', atk: 50, asset: type, ...extra });
const boss = (extra = {}) => ({ id: 'B', bookId: 'bossDeer', name: '森の主', asset: 'bossDeer', hp: 1, maxHp: 1000, atk: 0, def: 0,
  weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: false, boss: true, summoned: 99, summons: [], ...extra });

function spy(d) {
  const msgs = [];
  d.env.window.webkit = { messageHandlers: { progress: { postMessage: (m) => msgs.push(m) } } };
  return msgs;
}

async function main() {
  Math.random = () => 0.5;
  const weapons = [wp('短剣', 'dagger', { ench: 'vampire', enchLv: 3 }), wp('杖', 'staff')];

  // ---- 章ボス
  {
    const d = makeDriver();
    const msgs = spy(d);
    d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, mossHeartStages: [0] });
    d.seed(RUN_SAVE_KEY, { floor: 10, node: 0, player: { hp: 72, poison: 0, atkUp: 0, guard: false }, weapons,
      armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, enemies: [boss()] });
    await d.mount();
    await d.click('再開'); await d.flush();
    await d.click(d.findButtonContaining('試験の短剣'));
    await d.flushUntil(() => msgs.some((m) => m.event === 'weapon_boss_kill'), { tries: 80 });
    const kills = msgs.filter((m) => m.event === 'weapon_boss_kill');
    check('weapon_boss_kill is sent once per equipped weapon', kills.length === 2, kills);
    check('enchanted weapon carries ench / ench_lv', kills.some((m) => m.weapon_type === 'dagger' && m.ench === 'vampire' && m.ench_lv === 3), kills);
    check('plain weapon is "none" / 0', kills.some((m) => m.weapon_type === 'staff' && m.ench === 'none' && m.ench_lv === 0), kills);
  }

  // ---- ボスラッシュ
  {
    const d = makeDriver();
    const msgs = spy(d);
    d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, clears: 1 });
    d.seed(RUSH_KEY, { floor: 30, node: 0, nodes: ['boss'], player: { hp: 600, poison: 0, atkUp: 0, guard: false }, weapons,
      armor: { helm: null, armor: null, charm: null }, inv: [], cds: {}, lastRareSeen: 0, orbBagBonus: 0, turn: 2,
      rush: { idx: 2, atk: 0, dr: 0, hp: 0, choices: null, picked: false }, rushPhase: 'battle', enemies: [boss()] });
    await d.mount(); await d.flush();
    await d.click('ボスラッシュ 再開'); await d.flush();
    await d.click(d.findButtonContaining('試験の短剣'));
    await d.flushUntil(() => msgs.some((m) => m.event === 'rush_boss_kill'), { tries: 100 });
    await d.flush();
    check('rush_boss_kill still reports the boss number', msgs.some((m) => m.event === 'rush_boss_kill' && m.stage === 3), msgs);
    const ench = msgs.filter((m) => m.event === 'rush_ench_boss_kill');
    check('rush_ench_boss_kill only for the enchanted weapon', ench.length === 1 && ench[0].ench === 'vampire' && ench[0].ench_lv === 3 && ench[0].stage === 3, ench);
  }

  console.log(fails ? 'FAIL' : 'PASS');
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
