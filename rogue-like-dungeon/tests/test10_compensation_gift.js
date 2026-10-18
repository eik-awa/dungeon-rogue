// The one-time "sorry for the dew bug" compensation popup has been retired: it must never show
// (not for a fresh install, not for an existing player who never claimed it), and merely launching
// the game must never grant the 5 crystals either.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

async function launch(seedMeta) {
  const d = makeDriver();
  if (seedMeta) d.seed(SAVE_KEY, seedMeta);
  await d.mount();
  await d.flush(100);
  return d;
}

async function main() {
  const fresh = await launch(null);
  const okFresh = !fresh.text().includes('お詫びと感謝の印');
  console.log('[1] fresh install: no compensation popup:', okFresh);

  const unclaimed = await launch({ slots: 1, checkpoint: 3, dewBank: 2, deaths: 5, everHadWeapon: true });
  const okUnclaimed = !unclaimed.text().includes('お詫びと感謝の印');
  console.log('[2] existing player who never claimed: no popup either:', okUnclaimed);
  const meta = unclaimed.readJSON(SAVE_KEY);
  const okNoGrant = !meta || (meta.dewBank || 0) === 2;
  console.log('[3] launching grants nothing (dewBank stays 2):', meta && meta.dewBank);

  const pass = okFresh && okUnclaimed && okNoGrant;
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
