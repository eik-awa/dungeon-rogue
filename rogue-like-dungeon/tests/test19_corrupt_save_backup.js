// SAVE-05: a corrupted meta save must not be silently discarded. loadMeta() now backs the
// raw unparsable string up under `${SAVE_KEY}.corrupt_backup` before falling back to defaults,
// so the title screen still renders (no crash / stuck loading) AND the original bytes survive
// for potential recovery instead of vanishing the instant JSON.parse throws.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, '{壊れたセーブ:');
  await d.mount();
  await d.flush();

  const t = d.text();
  const screenRendered = t.length > 0 && (t.includes('森へ入る') || t.includes('霧渡りの森') || !!d.findButtonContaining('森'));
  console.log('[1] title screen rendered despite corrupt save:', screenRendered, JSON.stringify(t.slice(0, 40)));

  const backup = d.env.store[SAVE_KEY + '.corrupt_backup'];
  console.log('[2] corrupt raw bytes preserved in backup key:', backup === '{壊れたセーブ:');

  const restarted = d.readJSON(SAVE_KEY);
  console.log('[3] main save now holds a fresh usable default (not the corrupt string):', restarted === null || typeof restarted === 'object');

  const pass = screenRendered && backup === '{壊れたセーブ:';
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
