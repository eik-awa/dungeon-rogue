// 拾う武器の比較ヒント: エンチャント付きの武器は、攻撃力の比較(「同種の方が強い」など)とは別枠にする。
//   - エンチャント付きの武器は、同じ武器種・同じエンチャント・同じ段階のものとだけ比べる。いなければヒントは出さない(エンチャント名は一覧に出ているので)
//   - エンチャント無しの武器は、エンチャント無しの同種とだけ比べる(エンチャント付きの同種がいくら強くても「↓」にしない)
//   - 同種が1本も無ければ、従来どおり「新しい武器種です」
//   - ヒントは攻撃力の差の数字だけ(「↑ 攻 +50」「↓ 攻 -180」。一覧のマスが2行にならないように)
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';
let fails = 0;
const check = (n, ok, extra) => { console.log((ok ? 'ok  ' : 'NG  ') + n + (ok ? '' : ' ' + JSON.stringify(extra))); if (!ok) fails++; };
const wp = (id, type, atk, extra = {}) => ({ id, kind: 'weapon', type, name: `試験の${id}`, rarity: 'epic', atk, asset: type, ...extra });

async function hints(weapons, inv, drops) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, bestFloor: 10, discovered: {}, skills: {} });
  d.seed(RUN_SAVE_KEY, { floor: 10, node: 0, player: { hp: 100, poison: 0, atkUp: 0, guard: false }, weapons,
    armor: { helm: null, armor: null, charm: null }, inv, cds: {}, lastRareSeen: 0, orbBagBonus: 0, rewardPhase: 'reward', drops });
  await d.mount();
  await d.click('再開'); await d.flush();
  return [...d.container.querySelectorAll('.kw-cell')].map((c) => (c.querySelector('.kw-hint-diff') || {}).textContent || '');
}

async function main() {
  Math.random = () => 0.5;
  // 手持ち: エンチャント無しの剣(攻100)、吸魂Lv1の剣(攻300)
  const weapons = [wp('剣A', 'greatsword', 100), wp('剣B', 'greatsword', 300, { ench: 'vampire', enchLv: 1 })];
  const [plain, vampLow, vampHigh, otherEnch, otherLv, newType] = await hints(weapons, [], [
    wp('拾1', 'greatsword', 150),                                   // 無し: 剣A(100)とだけ比べる → 最強
    wp('拾2', 'greatsword', 120, { ench: 'vampire', enchLv: 1 }),  // 吸魂Lv1: 剣B(300)と比べる → ↓
    wp('拾3', 'greatsword', 350, { ench: 'vampire', enchLv: 1 }),  // 吸魂Lv1: 剣B より強い → ↑
    wp('拾4', 'greatsword', 50, { ench: 'pierce', enchLv: 1 }),    // 貫き: 比べる相手がいない → ヒントなし
    wp('拾5', 'greatsword', 50, { ench: 'vampire', enchLv: 2 }),   // 吸魂Lv2: 段階が違う → ヒントなし
    wp('拾6', 'staff', 10, { ench: 'pierce', enchLv: 1 }),         // 同種なし → 新しい武器種
  ]);
  check('plain weapon is compared only with plain ones (not with the stronger enchanted one)', plain === '↑ 攻 +50', plain);
  check('enchanted weapon is compared with the same enchant and level', vampLow === '↓ 攻 -180', vampLow);
  check('enchanted weapon stronger than the same enchant', vampHigh === '↑ 攻 +50', vampHigh);
  check('different enchant: no hint at all', otherEnch === '', otherEnch);
  check('same enchant but other level: no hint at all', otherLv === '', otherLv);
  check('no same type at all: "新しい武器種です"', newType === '新しい武器種です', newType);

  // エンチャント無しを拾うが、同種はエンチャント付きしか持っていない → 攻撃力で「↓」を出さない
  const [onlyEnchPeer] = await hints([wp('剣B', 'greatsword', 300, { ench: 'vampire', enchLv: 1 })], [], [wp('拾7', 'greatsword', 100)]);
  check('plain weapon vs only enchanted peers: no "↓ 攻 -xxx"', !onlyEnchPeer.includes('↓') && !onlyEnchPeer.includes('新しい武器種'), onlyEnchPeer);

  // 同種の中間(最弱より強いが最強ではない)は、最弱との差。同じ攻撃力なら ±0
  const [mid, same] = await hints([wp('剣A', 'greatsword', 100), wp('剣C', 'greatsword', 200)], [], [wp('拾8', 'greatsword', 130), wp('拾9', 'greatsword', 100)]);
  check('between the weakest and the strongest: difference from the weakest', mid === '↑ 攻 +30', mid);
  check('same attack as the weakest: ±0', same === '攻 ±0', same);

  console.log(fails ? 'FAIL' : 'PASS');
  process.exit(fails ? 1 : 0);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
