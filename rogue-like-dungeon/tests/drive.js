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
    flush, mount, click, doubleClickRace, text, seed, readJSON,
    SAVE_KEY, RUN_SAVE_KEY,
  };
}

module.exports = { makeDriver, SAVE_KEY, RUN_SAVE_KEY };
