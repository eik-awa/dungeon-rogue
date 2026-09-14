// Scenario: the one-time "sorry for the dew bug" compensation gift (5 精の結晶) must show on
// launch for a player who hasn't claimed it, grant exactly +5 dewBank when claimed, persist the
// claimed flag, and never show or grant again on a later launch (no re-farming).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

async function testFirstLaunchClaim() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, dewBank: 0 }); // compensationDewClaimed absent -> defaults false
  await d.mount();
  console.log('[1] popup shown on first launch:', d.text().includes('お詫びと感謝の印'));

  await d.click('受け取る');
  await d.flush(100);
  const meta = d.readJSON(SAVE_KEY);
  console.log('[2] dewBank after claiming (expect 5):', meta.dewBank);
  console.log('[3] compensationDewClaimed persisted:', meta.compensationDewClaimed === true);
  return meta.dewBank === 5 && meta.compensationDewClaimed === true;
}

async function testNoRepeat() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, dewBank: 5, compensationDewClaimed: true });
  await d.mount();
  console.log('[4] popup NOT shown once already claimed:', !d.text().includes('お詫びと感謝の印'));
  const meta = d.readJSON(SAVE_KEY);
  console.log('[5] dewBank unchanged by merely launching again (expect 5):', meta.dewBank);
  return !d.text().includes('お詫びと感謝の印') && meta.dewBank === 5;
}

async function main() {
  const a = await testFirstLaunchClaim();
  const b = await testNoRepeat();
  console.log(a ? 'PASS: first-launch claim grants exactly +5 once' : 'FAIL: first-launch claim');
  console.log(b ? 'PASS: already-claimed players see nothing and gain nothing extra' : 'FAIL: repeat-claim guard');
  process.exit(a && b ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
