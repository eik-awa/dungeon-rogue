// BTL-11: entering battle with zero weapons equipped AND none in the bag must not leave the
// player unable to act — enterNode() auto-generates a fallback common dagger into slot 0.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkRun() {
  // node:0 with no `enemies` -> resumeRun() calls enterNode() for node 0 (always "battle").
  return {
    floor: 1, node: 0,
    player: { hp: 72, poison: 0, atkUp: 0, guard: false },
    weapons: [null, null, null], // completely weaponless
    armor: { helm: null, armor: null, charm: null }, inv: [], // and nothing in the bag either
    cds: {}, lastRareSeen: 0, orbBagBonus: 0,
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkRun());
  await d.mount();
  await d.click('再開');
  await d.flush();

  console.log('[1] fallback weapon message shown:', d.text().includes('折れかけた短剣'));

  const run = d.readJSON(RUN_SAVE_KEY);
  const fallbackWeapon = run.weapons?.[0];
  console.log('[2] a weapon was auto-equipped into slot 0:', JSON.stringify(fallbackWeapon));

  // Confirm the player can actually act: a usable (non-disabled) weapon button now exists.
  const attackable = !!d.findButtonContaining(fallbackWeapon?.name || '短剣');
  console.log('[3] weapon card is clickable (not stuck unable to act):', attackable);

  const pass = !!fallbackWeapon && fallbackWeapon.type === 'dagger' && attackable;
  console.log(pass ? 'PASS' : 'FAIL: weaponless battle left the player unable to act');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
