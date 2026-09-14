const { makeEnv } = require('./setup');

const SAVE_KEY = 'kiriwatari-forest-save';
const RUN_SAVE_KEY = 'kiriwatari-run-save';

function makeDriver() {
  const env = makeEnv();
  const React = require('react');
  const { act } = require('react-dom/test-utils');
  const { createRoot } = require('react-dom/client');
  delete require.cache[require.resolve('./component.compiled.js')];
  const KiriwatariNoMori = require('./component.compiled.js');

  const container = env.document.createElement('div');
  env.document.body.appendChild(container);
  const root = createRoot(container);

  function findButtonContaining(substr) {
    const buttons = container.querySelectorAll('button');
    for (const b of buttons) {
      if (b.textContent && b.textContent.includes(substr) && !b.disabled) return b;
    }
    return null;
  }
  function findAllButtonsContaining(substr) {
    return Array.from(container.querySelectorAll('button')).filter(
      (b) => b.textContent && b.textContent.includes(substr)
    );
  }
  async function flush(ms = 20) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, ms));
      await Promise.resolve();
      await Promise.resolve();
    });
  }
  // setup.js overrides window.setTimeout to always fire on the next real macrotask
  // regardless of the requested ms, so a single flush() only advances one internal
  // sleep() step. A multi-step async chain (e.g. attackWith's sleep(650) -> enemyPhase's
  // sleep(380) per enemy) needs one flush() per step, and the exact number of steps is an
  // implementation detail callers shouldn't have to hardcode. flushUntil() calls flush()
  // repeatedly until `predicate()` is true (or `tries` is exhausted), which is what settles
  // a combat turn reliably regardless of how many enemies/sleeps are involved.
  // Gotcha: prefer polling on ground-truth data (e.g. `d.readJSON(RUN_SAVE_KEY)` changing) over
  // UI signals like "a button became enabled" when settling a combat turn. The game has a
  // busy-stuck watchdog (a real 3000ms setTimeout that force-clears g.busy) which, under this
  // harness's sped-up timers, can fire and flip busy=false BEFORE the real turn-resolution
  // path's own saveRun() runs — a UI-based predicate can then report "settled" prematurely.
  async function flushUntil(predicate, { tries = 30, ms = 20 } = {}) {
    for (let i = 0; i < tries; i++) {
      if (predicate()) return true;
      await flush(ms);
    }
    return predicate();
  }
  async function mount() {
    await act(async () => {
      root.render(React.createElement(KiriwatariNoMori));
      await new Promise((r) => setTimeout(r, 50));
    });
  }
  async function click(elOrText) {
    const el = typeof elOrText === 'string' ? findButtonContaining(elOrText) : elOrText;
    if (!el) throw new Error('button not found: ' + elOrText);
    await act(async () => {
      el.dispatchEvent(new env.window.MouseEvent('click', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });
  }
  // Fire two clicks back-to-back with NO await/flush between the dispatches themselves,
  // to probe for double-submit / race duplication on a single button.
  async function doubleClickRace(elOrText) {
    const el = typeof elOrText === 'string' ? findButtonContaining(elOrText) : elOrText;
    if (!el) throw new Error('button not found: ' + elOrText);
    await act(async () => {
      el.dispatchEvent(new env.window.MouseEvent('click', { bubbles: true, cancelable: true }));
      el.dispatchEvent(new env.window.MouseEvent('click', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });
  }
  // Same idea, but for two DIFFERENT elements (e.g. two different item cells, or two
  // different choice buttons) — both dispatched with no await/flush between them, inside
  // a single act(), to probe for cross-action races (one action's apply silently clobbering
  // another's because both read the same pre-update snapshot).
  async function raceClicks(elA, elB) {
    if (!elA) throw new Error('raceClicks: first element not found');
    if (!elB) throw new Error('raceClicks: second element not found');
    await act(async () => {
      elA.dispatchEvent(new env.window.MouseEvent('click', { bubbles: true, cancelable: true }));
      elB.dispatchEvent(new env.window.MouseEvent('click', { bubbles: true, cancelable: true }));
      await Promise.resolve();
    });
  }
  function text() {
    return container.textContent;
  }
  function seed(key, obj) {
    env.store[key] = typeof obj === 'string' ? obj : JSON.stringify(obj);
  }
  function readJSON(key) {
    const v = env.store[key];
    if (!v) return null;
    try { return JSON.parse(v); } catch { return null; }
  }

  return {
    env, container, root, findButtonContaining, findAllButtonsContaining,
    flush, flushUntil, mount, click, doubleClickRace, raceClicks, text, seed, readJSON,
    SAVE_KEY, RUN_SAVE_KEY,
  };
}

module.exports = { makeDriver, SAVE_KEY, RUN_SAVE_KEY };
