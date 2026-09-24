// Feature (user-requested): starting a fight with no weapon equipped must never leave the
// player weaponless. During the stage-start gear prep the player can unequip everything; on
// "戦闘を始める" a weapon is auto-equipped (best one from the bag, or a found emergency dagger).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true });
  await d.mount();
  await d.click('森 へ 入 る');
  await d.flush();
  await d.click('踏 み 入 れ る');
  await d.flush();

  const equipped = Array.from(d.container.querySelectorAll('button.kw-cell'))[0];
  await d.click(equipped); // unequip the only weapon (goes to the bag)
  await d.flush();
  // Re-equip must work during gear prep: the unequipped weapon shows a "装備する" button.
  const reEquip = d.findButtonContaining('装備する');
  console.log('[0] unequipped weapon can be re-equipped during gear prep:', !!reEquip);
  if (reEquip) { await d.click(reEquip); await d.flush(); }
  console.log('[0b] re-equipped (equipped card back, bag empty of weapons):', d.container.querySelectorAll('button.kw-cell').length > 0 && !d.findButtonContaining('装備する'));
  await d.click(Array.from(d.container.querySelectorAll('button.kw-cell'))[0]); // unequip again
  await d.flush();
  await d.click('戦闘を始める →');
  await d.flush();

  const handCards = d.container.querySelectorAll('.kw-hand button');
  console.log('[1] a weapon card is present in the hand after starting:', handCards.length > 0);
  const log = d.container.querySelector('.kw-log').textContent;
  console.log('[2] log explains the auto-equip:', log.includes('手に武器がない'));
  const pass = handCards.length > 0 && log.includes('手に武器がない');
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
