// BTL-08: a rare enemy (金枝の精) that flees on a timeout (fleeIn reaches 0) must not drop
// dew, and — a real bug found while writing this test — must not softlock the battle screen
// either. If the rare is the LAST enemy alive and flees during enemyPhase (the enemy's own
// turn), that hp=0 assignment happens outside afterPlayerAction's alive.length===0 check
// (which only runs before enemyPhase, gating on the player's kill), so the game used to stay
// on the "battle" phase forever with zero attackable targets and no way to proceed except
// quitting to the title. Fixed by having enemyPhase itself call battleWon() when every enemy
// ends its turn dead/fled, mirroring the wait-for-render-then-battleWon pattern
// afterPlayerAction already uses for player-caused kills.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    // The rare is the ONLY enemy here (mirrors a real playthrough state where the player
    // already cleared the regular enemies in earlier turns and only the rare remains).
    // fleeIn:1 means it times out on this very next enemy turn.
    enemies: [{ id: 'rareA', bookId: 'wisp', name: '金枝の精', asset: 'wisp', hp: 50, maxHp: 50,
      atk: 0, def: 0, weak: [], resist: [], poison: false, drain: false, atkDown: 0, rare: true, boss: false, fleeIn: 1 }],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  // Take a no-damage turn ("防御") so the rare's own turn ticks fleeIn down to 0 and it flees.
  await d.click('防御');
  await d.flushUntil(() => d.text().includes('森の奥へ消えてしまった') && d.text().includes('勝 利'), { tries: 80 });

  const onRewardScreen = d.text().includes('勝 利');
  console.log('[1] transitions to the reward screen instead of softlocking on "battle":', onRewardScreen);

  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[2] phase persisted is not stuck mid-battle (no leftover fled enemy in storage):', JSON.stringify(run.enemies));

  const dewOffered = d.text().includes('宝 樹 の 雫');
  console.log('[3] no dew-ad offer / no dew drop from the fled rare:', !dewOffered);

  const pass = onRewardScreen && !dewOffered;
  console.log(pass ? 'PASS' : 'FAIL: fled rare either softlocked the battle or granted dew');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
