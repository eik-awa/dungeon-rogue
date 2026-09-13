// Scenario: player has locked more items than their 継承枠(slots) can hold, then dies and
// rebirths. Locked items must be prioritized but still respect the slot cap — locking must not
// bypass the cap entirely (that would make 継承枠 meaningless), and losing the excess must not
// look like "everything was lost" (a subset should always survive).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkWeapon(atk, extra = {}) {
  return { id: 'w' + atk, kind: 'weapon', type: 'dagger', name: 'テスト短剣' + atk, rarity: 'common', atk, asset: 'dagger', ...extra };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 2, checkpoint: 1 });
  d.seed(RUN_SAVE_KEY, {
    phase: 'dead', floor: 1,
    weapons: [mkWeapon(10, { locked: true }), mkWeapon(20, { locked: true }), mkWeapon(30, { locked: true })],
    armor: { helm: null, armor: null, charm: null },
    inv: [], orbBagBonus: 0, orbSlotBonus: 0,
  });

  await d.mount();
  await d.click('転生を選ぶ');
  await d.flush();
  console.log('[1] slot counter shows the cap, not unlimited ("選択 2 / 2"):', d.text().includes('選択 2 / 2'));

  const rebirthBtn = d.findButtonContaining('生まれ変わる');
  await d.click(rebirthBtn);
  await d.flush(100);

  const run = d.readJSON(RUN_SAVE_KEY);
  const meta = d.readJSON(SAVE_KEY);
  const allNextItems = [...(run.weapons || []).filter(Boolean), ...Object.values(run.armor || {}).filter(Boolean), ...(run.inv || [])];
  // NOTE: starterState() intentionally reassigns fresh ids (uid()) for a new life, so identity
  // must be checked by atk (a distinctive stand-in for "which weapon"), not id.
  const gotW10 = allNextItems.some((x) => x.kind === 'weapon' && x.atk === 10);
  const gotW20 = allNextItems.some((x) => x.kind === 'weapon' && x.atk === 20);
  const gotW30 = allNextItems.some((x) => x.kind === 'weapon' && x.atk === 30);
  console.log('[2] kept 2 of 3 locked weapons (cap respected):', gotW10 && gotW20 && !gotW30);
  console.log('[3] meta.inherited cleared after consumption (no duplication next time):', JSON.stringify(meta.inherited) === '[]');

  const pass = gotW10 && gotW20 && !gotW30;
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
