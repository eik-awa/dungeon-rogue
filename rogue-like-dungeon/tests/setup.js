// Test-environment shims. None of this changes game behavior — it only fills in browser
// APIs jsdom doesn't implement (canvas, matchMedia, Audio) and speeds up the game's internal
// sleep(ms) waits so battle/UI transitions resolve almost instantly during tests.
const { JSDOM } = require('jsdom');
const Module = require('module');
const React = require('react');

// Stub out lucide-react: these tests only need clickable text/labels, not real icon rendering,
// and pinning an exact icon-set version compatible with every icon name the game imports is
// unrelated churn (icon names get renamed across lucide-react versions). Any icon resolves to
// a trivial <svg>.
const IconStub = new Proxy({}, {
  get: () => (props) => React.createElement('svg', { ...props, 'data-icon-stub': true }),
});
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'lucide-react') return IconStub;
  return origLoad.apply(this, arguments);
};

function makeEnv() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://kwapp.test/',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  global.navigator = window.navigator;
  global.HTMLElement = window.HTMLElement;
  global.Node = window.Node;
  global.MouseEvent = window.MouseEvent;
  global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
  window.requestAnimationFrame = global.requestAnimationFrame;
  window.cancelAnimationFrame = global.cancelAnimationFrame;

  // Speed up the game's internal sleep(ms) (real setTimeout based animation waits) so
  // battle turns / transitions resolve almost instantly during tests, regardless of the
  // ms value the game code requests.
  const realSetTimeout = setTimeout;
  window.setTimeout = (fn, ms, ...args) => realSetTimeout(fn, 0, ...args);
  global.setTimeout = window.setTimeout;

  // In-memory storage backing (this is what we snapshot/seed/inspect to simulate
  // "app relaunch after task-kill": a fresh component instance reading the same store).
  const store = {};
  window.storage = {
    get: async (k) => ({ value: Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null }),
    set: async (k, v) => { store[k] = v; },
  };
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.webkit = undefined; // no native bridge; game code guards all calls with ?. + try/catch
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  global.matchMedia = window.matchMedia;
  window.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {}, fillRect() {}, beginPath() {}, arc() {}, fill() {}, save() {}, restore() {},
    translate() {}, scale() {}, moveTo() {}, lineTo() {}, stroke() {}, closePath() {}, drawImage() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    set fillStyle(v) {}, set strokeStyle(v) {}, set globalAlpha(v) {}, set lineWidth(v) {}, set shadowBlur(v) {}, set shadowColor(v) {},
    measureText: () => ({ width: 0 }),
  });
  class AudioStub {
    constructor() { this.paused = true; }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    addEventListener() {}
    removeEventListener() {}
  }
  window.Audio = AudioStub;
  global.Audio = AudioStub;

  return { window, document: window.document, store };
}

module.exports = { makeEnv };
