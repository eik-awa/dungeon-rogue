// Runs every test*.js in this directory as its own `node` process (for full isolation — the
// game module has top-level mutable state like `let UID = 1` that must not leak between
// scenarios) and prints a consolidated pass/fail summary. Non-zero exit if anything fails.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const dir = __dirname;
const files = fs.readdirSync(dir)
  .filter((f) => /^test\d+.*\.js$/.test(f))
  .sort();

if (files.length === 0) {
  console.error('No test*.js files found in', dir);
  process.exit(1);
}

let failures = 0;
for (const f of files) {
  console.log(`\n=== ${f} ===`);
  try {
    const out = execFileSync(process.execPath, [path.join(dir, f)], {
      encoding: 'utf8', timeout: 60000,
    });
    process.stdout.write(out);
  } catch (e) {
    failures++;
    if (e.stdout) process.stdout.write(e.stdout);
    if (e.stderr) process.stderr.write(e.stderr);
    console.log(`>>> ${f} exited non-zero`);
  }
}

console.log(`\n==========================================`);
console.log(`${files.length - failures}/${files.length} test files passed`);
console.log(failures === 0 ? 'ALL GREEN' : `${failures} FILE(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
