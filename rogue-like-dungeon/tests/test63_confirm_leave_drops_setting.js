// Feature (user-requested): the "拾い忘れがあります" confirmation shown when proceeding with
// uncollected drops can be turned ON/OFF in the settings (meta.confirmLeaveDrops, default ON).
//   - default / ON: pressing "先へ進む" with drops left shows the confirmation and does not advance
//   - OFF: pressing "先へ進む" advances immediately, leaving the drops behind (no dialog)
//   - the settings toggle flips the flag and persists it to the meta save
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRewardRun() {
  return {
    floor: 1, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 20, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null }, inv: [],
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
    rewardPhase: 'reward',
    drops: [{ id: 'dew1', kind: 'item', itemId: 'dew', name: '宝樹の雫', rarity: 'rare', asset: 'dew' }],
  };
}

async function proceedWith(metaExtra) {
  Math.random = () => 0.1;
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true, ...metaExtra });
  d.seed(RUN_SAVE_KEY, mkRewardRun());
  await d.mount();
  await d.click('再開');
  await d.flush();
  await d.click('先へ進む');
  await d.flush();
  return { d, run: d.readJSON(RUN_SAVE_KEY) };
}

async function main() {
  // [1] default (flag absent) -> confirmation is shown, run stays on the reward screen
  const a = await proceedWith({});
  const shownDefault = a.d.text().includes('拾い忘れがあります');
  const stayedDefault = a.run.rewardPhase === 'reward' && (a.run.drops || []).length === 1 && a.run.node === 0;
  console.log('[1] default ON: confirmation shown and run not advanced:', shownDefault, stayedDefault);

  // [2] explicit ON behaves the same
  const b = await proceedWith({ confirmLeaveDrops: true });
  console.log('[2] explicit ON: confirmation shown:', b.d.text().includes('拾い忘れがあります'));

  // [3] OFF -> no dialog, advanced past the node, drops left behind
  const c = await proceedWith({ confirmLeaveDrops: false });
  const shownOff = c.d.text().includes('拾い忘れがあります');
  const advanced = c.run.node === 1 && !(c.run.drops || []).length && !c.run.rewardPhase;
  const dewKept = (c.run.inv || []).some((it) => it.itemId === 'dew');
  console.log('[3] OFF: no confirmation, advanced, drop left behind:', !shownOff, advanced, !dewKept);

  // [4] settings toggle flips the flag and persists it
  const d4 = makeDriver();
  d4.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true });
  d4.seed(RUN_SAVE_KEY, mkRewardRun());
  await d4.mount();
  await d4.click('再開');
  await d4.flush();
  const gear = Array.from(d4.container.querySelectorAll('button')).find((x) => x.querySelector('svg') && !x.textContent.trim());
  // settings gear is the icon-only button next to 図鑑; locate it by its position instead of a label
  const zukan = d4.findButtonContaining('図鑑');
  const settingsBtn = zukan && zukan.previousElementSibling;
  await d4.click(settingsBtn || gear);
  await d4.flush();
  const rowBtn = (() => {
    const label = Array.from(d4.container.querySelectorAll('span')).find((s) => s.textContent.includes('拾い忘れの確認'));
    return label && label.parentElement.querySelector('button');
  })();
  console.log('[4a] settings row found, shows ON by default:', !!rowBtn && rowBtn.textContent === 'ON');
  if (rowBtn) await d4.click(rowBtn);
  await d4.flush();
  const saved = d4.readJSON(SAVE_KEY);
  console.log('[4b] toggle persisted confirmLeaveDrops=false:', saved && saved.confirmLeaveDrops === false);

  const pass = shownDefault && stayedDefault && b.d.text().includes('拾い忘れがあります')
    && !shownOff && advanced && !dewKept
    && !!rowBtn && rowBtn.textContent !== undefined && saved && saved.confirmLeaveDrops === false;
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
