// SAVE-06: resuming a run save that predates newer fields (armor/cds/lastRareSeen missing
// entirely — as if written by an older app version) must not crash. resumeRun()'s "battle"
// restore branch guards `cds`/`lastRareSeen`/`orbBagBonus` with `|| {}`/`|| 0`, but passes
// `armor: run.armor` through UNGUARDED — if that's missing, `Object.values(st.armor)` inside
// maxHpOf()/armorDef() throws (Object.values(undefined) is a TypeError), crashing the resume.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function mkOldSchemaRun() {
  // Deliberately omit armor / cds / lastRareSeen / orbBagBonus, as an old save format would.
  return {
    floor: 1, node: 0,
    player: { hp: 60, poison: 0, atkUp: 0, guard: false },
    weapons: [{ id: 'w1', kind: 'weapon', type: 'dagger', name: '試験の短剣', rarity: 'common', atk: 5, asset: 'dagger' }],
    inv: [],
  };
}

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {} });
  d.seed(RUN_SAVE_KEY, mkOldSchemaRun());

  let crashed = false;
  const origError = console.error;
  console.error = (...args) => { origError(...args); };
  process.on('uncaughtException', () => { crashed = true; });

  await d.mount();
  await d.click('再開');
  await d.flush();

  const rendered = d.text().length > 0 && !!d.findButtonContaining('試験の短剣');
  console.log('[1] resumed without crashing, battle screen rendered:', rendered, '| crashed:', crashed);

  const run = d.readJSON(RUN_SAVE_KEY);
  const armorFilledIn = run && run.armor && typeof run.armor === 'object';
  console.log('[2] missing fields backfilled with sane defaults (armor is an object):', armorFilledIn, JSON.stringify(run?.armor));

  const pass = !crashed && rendered;
  console.log(pass ? 'PASS' : 'FAIL: old-schema run save crashed or failed to resume');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
