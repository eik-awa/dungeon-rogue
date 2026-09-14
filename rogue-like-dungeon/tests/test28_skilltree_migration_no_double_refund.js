// SAVE-08: the skill-tree migration (refunds dew for legacy/removed skills into dewBank) must
// run at most once. migrateSkillTree() is idempotency-guarded by `skillTreeGen`, and the
// mount effect persists the migrated meta immediately (`saveMeta(migrated)`), so a second app
// launch reading the same save must NOT refund a second time.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

function mkPreMigrationMeta() {
  return {
    slots: 1, checkpoint: 1, discovered: {}, dewBank: 0,
    // No skillTreeGen field at all (pre-migration save), holding a legacy/removed skill
    // (startBonus was removed from SKILL_TREE; LEGACY_SKILL_COSTS.startBonus === 3).
    skills: { startBonus: true },
  };
}

async function main() {
  const d1 = makeDriver();
  d1.seed(SAVE_KEY, mkPreMigrationMeta());
  await d1.mount();
  await d1.flush();

  const afterFirst = d1.readJSON(SAVE_KEY);
  console.log('[1] first mount: skillTreeGen set, dewBank refunded once:', afterFirst.skillTreeGen, afterFirst.dewBank);

  // Second launch: a completely fresh driver reading the SAME persisted store (simulates
  // relaunching the app after the first migration already ran and was saved).
  const d2 = makeDriver();
  d2.env.store[SAVE_KEY] = d1.env.store[SAVE_KEY];
  await d2.mount();
  await d2.flush();

  const afterSecond = d2.readJSON(SAVE_KEY);
  console.log('[2] second mount (same save): dewBank unchanged (no double refund):', afterSecond.dewBank, 'skillTreeGen:', afterSecond.skillTreeGen);

  const refundedOnce = afterFirst.dewBank > 0;
  const noDoubleRefund = afterSecond.dewBank === afterFirst.dewBank;
  const genStable = afterSecond.skillTreeGen === afterFirst.skillTreeGen;

  const pass = refundedOnce && noDoubleRefund && genStable;
  console.log(pass ? 'PASS' : 'FAIL: skill tree migration refunded more than once');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
