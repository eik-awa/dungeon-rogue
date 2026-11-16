// レビュー「UIが見にくい・プレイしにくい」対応の回帰ガード(静的チェック)。
// 1) インラインの文字サイズは 11px 未満にしない  2) 手札は横スクロールではなく格子で全武器を見せる
// 3) ボタンは最低 40px の高さ  4) スキルツリーの説明文を文字数で切り詰めない
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'rogue-like-dungeon', 'kiriwatari-no-mori.jsx'), 'utf8');
let fails = 0;
const check = (name, ok) => { console.log((ok ? 'PASS: ' : 'FAIL: ') + name); if (!ok) fails++; };

const small = [...src.matchAll(/fontSize: ?(\d+(?:\.\d+)?)(?![\d.])/g)].map((m) => +m[1]).filter((v) => v < 11);
check('インラインの fontSize が 11px 未満になっていない', small.length === 0);

const hand = (src.match(/\.kw-hand \{[^}]*\}/) || [''])[0];
check('.kw-hand は格子(横スクロールしない)', /display: grid/.test(hand) && !/overflow-x: auto/.test(hand));
check('.kw-btn は min-height 40px 以上', /\.kw-btn \{[^}]*min-height: 40px/.test(src));
check('スキル説明を slice で切り詰めていない', !/skill\.desc\.slice\(/.test(src));
const chip = +((src.match(/\.kw-chip \{ font-size: (\d+(?:\.\d+)?)px/) || [])[1] || 0);
check('.kw-chip は 11px 以上', chip >= 11);

if (fails) { console.log(`${fails} failed`); process.exit(1); }
console.log('ALL PASS');
