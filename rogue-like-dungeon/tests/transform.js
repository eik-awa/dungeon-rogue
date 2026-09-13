// Compiles the real kiriwatari-no-mori.jsx (ESM + JSX) into a CommonJS module that the
// test harness can `require()` and render with real React/jsdom. This is NOT a reimplementation
// of the game logic — it's a straight Babel transform of the actual production source, with the
// `export default` swapped for `module.exports` so it stays require()-able.
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const SRC = path.join(__dirname, '..', 'rogue-like-dungeon', 'kiriwatari-no-mori.jsx');
let src = fs.readFileSync(SRC, 'utf8');
src = src.replace('export default function KiriwatariNoMori()', 'function KiriwatariNoMori()');
src += '\nmodule.exports = KiriwatariNoMori;\n';

const out = babel.transformSync(src, {
  sourceType: 'module',
  presets: ['@babel/preset-react'],
  plugins: ['@babel/plugin-transform-modules-commonjs'],
  filename: 'kiriwatari-no-mori.jsx',
}).code;

fs.writeFileSync(path.join(__dirname, 'component.compiled.js'), out);
console.log(`[transform] compiled ${SRC} -> component.compiled.js (${out.length} bytes)`);
