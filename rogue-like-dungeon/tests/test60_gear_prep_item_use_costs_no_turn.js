// Feature (user-requested): using items during the stage-start gear prep ("戦闘準備") must not
// consume a turn — the enemy must not act, and the player still moves first once the fight starts.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true, inherited: [
    { id: 'sp1', kind: 'item', itemId: 'spore', name: '力の胞子', rarity: 'common', asset: 'spore' },
  ] });
  await d.mount();
  await d.click('森 へ 入 る');
  await d.flush();
  await d.click('踏 み 入 れ る');
  await d.flush();

  const hpBefore = d.readJSON(RUN_SAVE_KEY).player.hp;
  const useBtn = d.findButtonContaining('使う');
  console.log('[1] buff item usable during gear prep:', !!useBtn);
  await d.click(useBtn);
  await d.flush(800);

  const bagStillOpen = d.text().includes('戦闘準備');
  const log = d.container.querySelector('.kw-log').textContent;
  const noEnemyTurn = !log.includes('ターン2') && !/から\d+ダメージを受けた/.test(log);
  const run = d.readJSON(RUN_SAVE_KEY);
  console.log('[2] gear prep stays open after using the item:', bagStillOpen);
  console.log('[3] no enemy turn happened (no turn 2, no damage taken):', noEnemyTurn, run.player.hp === hpBefore);
  console.log('[4] buff is active with its full duration (3 turns):', run.player.atkUp === 3, run.player.atkUp);
  const pass = !!useBtn && bagStillOpen && noEnemyTurn && run.player.hp === hpBefore && run.player.atkUp === 3;
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
