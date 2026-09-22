// Feature (user-requested): entering a new stage used to drop the player straight into
// battle with no chance to reorganize gear first (equip management is hidden during battle
// per policy). Now, dismissing the stage-intro banner opens a one-time "戦闘準備" (gear prep)
// window: the bag opens with the equip-management section available even though phase is
// already "battle", until the player explicitly taps "戦闘を始める →". After that, equip
// management goes back to being unavailable during battle, same as any other fight.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

async function main() {
  const d = makeDriver();
  // everHadWeapon:true skips the "はじめの武器を選ぶ" title picker so "森へ入る" starts immediately.
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true });
  await d.mount();
  await d.click('森 へ 入 る');
  await d.flush();

  console.log('[1] stage-intro banner shown on entering chapter 1:', d.text().includes('踏 み 入 れ る'));
  await d.click('踏 み 入 れ る');
  await d.flush();

  console.log('[2] gear-prep bag opens automatically:', d.text().includes('戦闘準備'));
  const equipSectionVisible = d.text().includes('装備中の武器');
  console.log('[3] equip-management section available even though phase is already battle:', equipSectionVisible);

  // Unequip the starter weapon to prove it's actually functional here, not just visible.
  const equippedCard = Array.from(d.container.querySelectorAll('button.kw-cell'))[0];
  const hadEquippedCard = !!equippedCard;
  if (equippedCard) { await d.click(equippedCard); await d.flush(); }
  console.log('[4] found an equipped-weapon card to unequip during gear prep:', hadEquippedCard);

  await d.click('戦闘を始める →');
  await d.flush();
  console.log('[5] gear prep closed after confirming:', !d.text().includes('戦闘準備'));

  // Re-opening the bag mid-battle (after gear prep ended) must NOT show equip management again.
  const bagBtn = Array.from(d.container.querySelectorAll('.kw-subbar button')).find((b) => b.textContent.includes('袋'));
  await d.click(bagBtn);
  await d.flush();
  const equipSectionGoneAfterPrep = !d.text().includes('装備中の武器');
  console.log('[6] equip-management no longer available on a later bag-open in the same fight:', equipSectionGoneAfterPrep);

  const pass = d.text() // sanity: still mounted
    && equipSectionVisible && hadEquippedCard && equipSectionGoneAfterPrep;
  console.log(pass ? 'PASS' : 'FAIL: stage-start gear prep window not working as intended');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
