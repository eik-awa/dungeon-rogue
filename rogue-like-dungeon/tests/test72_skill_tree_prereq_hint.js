// A locked skill with several prerequisites (力の刻印 needs all five element masteries) used to show only
// "???" and "前提スキルを習得すると解放されます。" — the player could not tell what was missing. The row now
// shows progress ("前提 n/5") and the detail panel lists each prerequisite with its owned/not-owned state.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

async function open(skills) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true, dewBank: 50, skills });
  await d.mount();
  await d.flush();
  await d.click('スキルツリー');
  await d.flush();
  return d;
}
const lockedRow = (d, badge) => Array.from(d.container.querySelectorAll('[role="button"]')).find((el) => el.textContent.includes(badge));

async function main() {
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  const d = await open({ bladeBasics: true, bladeMastery: true, magicBasics: true, magicMastery: true });
  const row = lockedRow(d, '前提 2/5');
  check('locked skill row shows progress (2 of 5 masteries)', !!row);
  if (row) { await d.click(row); await d.flush(); }
  const t = d.text();
  check('detail lists the required skills', t.includes('必要なスキル') && t.includes('斬の極意') && t.includes('魔の極意') && t.includes('突の極意') && t.includes('打の極意') && t.includes('音の極意'));
  check('owned prerequisites are marked as owned, the rest as missing', t.includes('斬の極意(習得済)') && t.includes('魔の極意(習得済)') && t.includes('突の極意(未習得)') && t.includes('音の極意(未習得)'));

  // single-prerequisite hidden skill: lists its one prerequisite too
  const d2 = await open({});
  const single = Array.from(d2.container.querySelectorAll('[role="button"]')).find((el) => el.textContent.includes('???') && !el.textContent.includes('前提'));
  if (single) { await d2.click(single); await d2.flush(); }
  check('single-prerequisite locked skill also names its prerequisite', !!single && d2.text().includes('必要なスキル'));

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
