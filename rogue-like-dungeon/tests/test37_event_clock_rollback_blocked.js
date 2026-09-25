// AD-05: rolling the device clock backward must not let a player re-challenge the shrine.
// eventStatus() flags `clockBack` when `now < eventSeenMax - EVENT_CLOCK_SKEW` (the app
// remembers the latest time it has ever observed), and the intro screen shows a warning
// instead of the "挑戦する" button whenever clockBack is true (checked before `available`).
const { makeDriver, skipIfEventDisabled } = require('./drive');
skipIfEventDisabled();
const SAVE_KEY = 'kiriwatari-forest-save';

const EVENT_JST_OFFSET = 9 * 3600_000;
const FIXED_NOW = new Date('2026-09-20T12:00:00Z').getTime();
const eventJstDay = (t) => new Date(t + EVENT_JST_OFFSET).toISOString().slice(0, 10);

async function main() {
  const origDateNow = Date.now;
  Date.now = () => FIXED_NOW; // simulates the clock having been rolled BACK to this instant
  let pass = false;
  try {
    const d = makeDriver();
    d.seed(SAVE_KEY, {
      slots: 1, checkpoint: 1, discovered: {},
      // The app previously observed a much LATER time than "now" -> rollback detected.
      eventSeenMax: FIXED_NOW + 3 * 3600_000,
      eventDay: null, // not claimed today, so this isn't just the normal "already claimed" gate
    });
    await d.mount();
    await d.flush();

    await d.click('宝 樹 の 祠');
    await d.flush();

    const warningShown = d.text().includes('端末の時刻が実際より前に設定されています');
    const challengeBtn = d.findButtonContaining('挑 戦 す る');
    console.log('[1] clock-rollback warning shown:', warningShown);
    console.log('[2] "挑戦する" button NOT offered:', !challengeBtn);

    pass = warningShown && !challengeBtn;
    console.log(pass ? 'PASS' : 'FAIL: clock rollback did not block re-challenging the shrine');
  } finally {
    Date.now = origDateNow;
  }
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
