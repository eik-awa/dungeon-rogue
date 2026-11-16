// 武器は1段のアイコン列(名前は視覚的に隠して残す)。タップで攻撃/長押しで詳細。
// ボスラッシュの説明は「遊び方」⑥(踏破済みのときだけ)にあり、核の武器名は画面のどこにも出さない。
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';
const { act } = require('react-dom/test-utils');
const fire = (d, el, type) => act(async () => { el.dispatchEvent(new d.env.window.MouseEvent(type, { bubbles: true, cancelable: true })); await Promise.resolve(); });
let fails = 0;
const check = (n, ok) => { console.log((ok ? 'ok  ' : 'NG  ') + n); if (!ok) fails++; };

async function main() {
  {
    const d = makeDriver();
    d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, clears: 0, everHadWeapon: true });
    await d.mount();
    await d.click(d.findButtonContaining('遊び方'));
    await d.flush();
    check('before the first clear, no ⑥ tab (no spoilers)', !d.findButtonContaining('⑥ ボスラッシュ'));
  }
  {
    const d = makeDriver();
    d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, clears: 1, everHadWeapon: true });
    await d.mount();
    await d.click(d.findButtonContaining('遊び方'));
    await d.flush();
    await d.click(d.findButtonContaining('⑥ ボスラッシュ'));
    await d.flush();
    const t = d.text();
    check('⑥ explains escorts, revive, loaner', t.includes('取り巻きが増えて') && t.includes('1度だけ立て直せます') && t.includes('借りられます'));
    check('⑥ does not say which weapon opens which core', !t.includes('核') && !t.includes('杖で') );
  }
  {
    // 戦闘中: 武器は1段のアイコン列。長押しで詳細、短いタップでは詳細は出ない(名前は視覚的に隠して残る)
    const d = makeDriver();
    d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true });
    await d.mount();
    await d.click(d.findButtonContaining('森 へ 入 る'));
    await d.flush(60);
    await d.click(d.findButtonContaining('踏 み 入 れ る'));
    await d.flush(60);
    await d.click(d.findButtonContaining('戦闘を始める'));
    await d.flush(60);
    await d.click(d.findButtonContaining('はじめる'));
    await d.flush();
    const slots = d.container.querySelectorAll('.kw-hand .kw-wslot');
    check('the hand is one row of slots (3 at the start)', slots.length === 3);
    const card = d.container.querySelector('.kw-wcard:not(.empty)');
    check('the weapon name stays in the DOM (visually hidden) for search/readers', !!card.querySelector('.kw-sr') && card.querySelector('.kw-sr').textContent.length > 0);
    const slot = card.parentElement;
    await act(async () => { for (const t of ['pointerdown', 'pointerup']) slot.dispatchEvent(new d.env.window.MouseEvent(t, { bubbles: true })); await Promise.resolve(); });
    await d.flush(30);
    check('a quick tap does not open the detail sheet', !d.container.querySelector('.kw-sheet h2'));
    await fire(d, slot, 'pointerdown'); await d.flush(30);
    check('a long press opens the detail sheet', !!d.container.querySelector('.kw-sheet h2') && d.text().includes('素早い二連撃'));
    await d.click([...d.container.querySelectorAll('.kw-sheet button')].find((b) => b.textContent.includes('閉じる')));
    await d.flush();
    check('the sheet closes', !d.container.querySelector('.kw-sheet h2'));
  }
  {
    // 核は裏側のステータス: コメントと敵名「星核の精」を除き、プレイヤーに見える文字列に「核」を出さない
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'rogue-like-dungeon', 'kiriwatari-no-mori.jsx'), 'utf8');
    const shown = src.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .map((l) => l.replace(/\/\/.*$/, '').replace(/星核の精|星の核/g, ''))
      .filter((l) => l.includes('核'));
    check('no player-facing text names the core (核)', shown.length === 0 && (console.log(shown.join('\n')), true));
  }
  if (fails) { console.log(`FAIL (${fails} failed)`); process.exit(1); }
  console.log('ALL PASS');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
