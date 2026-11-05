// A locked skill with several prerequisites (力の刻印 needs all five element masteries) used to show only
// "???" and "前提スキルを習得すると解放されます。" — the player could not tell what was missing. The detail
// panel now lists the prerequisites that are ALREADY VISIBLE in the tree (owned, or shown by name) with their
// owned / not-owned state. Prerequisites that are still hidden ("???") are never named — naming them would let
// the player guess which skills exist — the panel only says there are more.
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
// Click every locked ("???") row until the detail panel for 力の刻印 (the one that lists 斬の極意) is shown.
async function openSealDetail(d, markers) {
  const rows = Array.from(d.container.querySelectorAll('[role="button"]')).filter((el) => el.textContent.includes('???'));
  for (const row of rows) {
    await d.click(row);
    await d.flush();
    if (markers.every((m) => d.text().includes(m))) return true;
  }
  return false;
}

async function main() {
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };

  // blade + magic masteries owned; pierce/blunt/sound are still hidden (their basics are not owned)
  const d = await open({ bladeBasics: true, bladeMastery: true, magicBasics: true, magicMastery: true });
  const found = await openSealDetail(d, ['斬の極意(習得済)', '魔の極意(習得済)']);
  const t = d.text();
  check('detail of the locked skill lists the visible prerequisites with their state', found && t.includes('必要なスキル') && t.includes('魔の極意(習得済)'));
  check('hidden prerequisites are NOT named', !t.includes('突の極意') && !t.includes('打の極意') && !t.includes('音の極意'));
  check('but it says more are needed', t.includes('ほかにも必要なスキルがあります'));
  check('the list rows show no progress counter (no hint of how many exist)', !t.includes('前提 '));

  // every prerequisite visible (all five basics owned -> all five masteries revealed): all are named, no "ほかにも"
  const d2 = await open({ bladeBasics: true, magicBasics: true, pierceBasics: true, bluntBasics: true, soundBasics: true });
  const found2 = await openSealDetail(d2, ['斬', '魔', '突', '打', '音'].map((x) => `${x}の極意(未習得)`));
  const t2 = d2.text();
  check('all prerequisites visible: all are named with their state', found2 && ['斬', '魔', '突', '打', '音'].every((x) => t2.includes(`${x}の極意(未習得)`)));
  check('all prerequisites visible: no "more are needed" note', !t2.includes('ほかにも必要なスキルがあります'));

  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
