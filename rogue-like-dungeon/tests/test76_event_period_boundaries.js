// ランキング50位突破記念の祠イベントは JST 11/20 0:00 〜 11/27 23:30。
// 開始前・23:31 以降は祠の入口が出ず、開始ちょうどと最終日 23:29 は挑戦できる。
const { makeDriver, skipIfEventDisabled } = require('./drive');
skipIfEventDisabled();
const SAVE_KEY = 'kiriwatari-forest-save';
const at = (jst) => new Date(jst + '+09:00').getTime();

async function view(now) {
  const origDateNow = Date.now;
  Date.now = () => now;
  try {
    const d = makeDriver();
    d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, everHadWeapon: true });
    await d.mount();
    await d.flush();
    const entry = !!d.findButtonContaining('宝 樹 の 祠');
    if (!entry) return { entry, text: d.text(), challenge: false };
    await d.click('宝 樹 の 祠');
    await d.flush();
    return {
      entry,
      text: d.text(),
      challenge: !!d.findButtonContaining('挑 戦 す る'),
    };
  } finally {
    Date.now = origDateNow;
  }
}

async function main() {
  let ok = true;
  const check = (label, cond) => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${label}`); if (!cond) ok = false; };

  const before = await view(at('2026-11-19T23:59:00'));
  check('11/19 23:59 は未開催(祠の入口が出ない)', !before.entry && !before.challenge);

  const start = await view(at('2026-11-20T00:00:00'));
  check('11/20 0:00 ちょうどから挑戦可', start.challenge);
  check('見出しがランキング記念', start.text.includes('カテゴリ別ランキング 50位突破記念'));
  check('期間表示に 11.27 23:30', start.text.includes('11.27 23:30'));

  const last = await view(at('2026-11-27T23:29:00'));
  check('11/27 23:29 はまだ挑戦可', last.challenge);

  const end = await view(at('2026-11-27T23:31:00'));
  check('11/27 23:31 は終了(祠の入口が出ない)', !end.entry && !end.challenge);

  console.log(ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
