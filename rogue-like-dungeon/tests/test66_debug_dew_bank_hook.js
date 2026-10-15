// Debug hook: the native side (debug device only) calls window.__debugSetDewBank__(n) at appReady.
// It must raise meta.dewBank to n (persisted), never lower it, and survive being called before meta loads.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

async function call(d, n) {
  const act = require('react-dom/test-utils').act;
  await act(async () => { d.env.window.__debugSetDewBank__(n); await Promise.resolve(); });
  await d.flush();
}

async function main() {
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, dewBank: 3 });
  await d.mount();
  await d.flush();
  check('hook is registered', typeof d.env.window.__debugSetDewBank__ === 'function');
  await call(d, 9999);
  check('dewBank raised to 9999 and persisted', d.readJSON(SAVE_KEY).dewBank === 9999, d.readJSON(SAVE_KEY).dewBank);

  const d2 = makeDriver();
  d2.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, dewBank: 20000 });
  await d2.mount();
  await d2.flush();
  await call(d2, 9999);
  check('never lowers an existing larger dewBank', d2.readJSON(SAVE_KEY).dewBank === 20000, d2.readJSON(SAVE_KEY).dewBank);

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
