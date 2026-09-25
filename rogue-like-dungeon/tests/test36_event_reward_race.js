// AD-04: racing the shrine's daily reward choice buttons ("継承枠+1" / "精の結晶+1") must
// apply exactly one of them, never both. eventConvert() reads gRef.current synchronously
// (good — not the committed-pattern bug), but unlike its sibling resolveOrbChoice() it never
// does `gRef.current = ns` after setG(), so a same-tick second call still sees the PRE-update
// gRef.current and can pass the `converted.length >= total` guard a second time.
//
// The shrine event is time-gated to EVENT_START..EVENT_END (a fixed window unrelated to
// whatever "today" the test machine's clock reports), so Date.now() is stubbed to a fixed
// instant inside that window just for this test (only the numeric `now`, not the Date
// constructor itself — eventJstDay() always receives an explicit epoch argument).
const { makeDriver, skipIfEventDisabled } = require('./drive');
skipIfEventDisabled();
const SAVE_KEY = 'kiriwatari-forest-save';

const EVENT_JST_OFFSET = 9 * 3600_000;
const FIXED_NOW = new Date('2026-09-20T12:00:00Z').getTime();
const eventJstDay = (t) => new Date(t + EVENT_JST_OFFSET).toISOString().slice(0, 10);

async function main() {
  const origDateNow = Date.now;
  Date.now = () => FIXED_NOW;
  let pass = false;
  try {
    const today = eventJstDay(FIXED_NOW);
    const d = makeDriver();
    d.seed(SAVE_KEY, {
      slots: 1, checkpoint: 1, discovered: {},
      eventDay: today, eventSeenMax: FIXED_NOW,
      eventReward: { converted: [], reward2x: false },
    });
    await d.mount();
    await d.flush();

    await d.click('宝 樹 の 祠');
    await d.flush();
    console.log('[1] shrine reward screen reached directly (claimedToday restore path):', d.text().includes('使いみちを選んでください'));

    const slotBtn = d.findButtonContaining('継承枠 +1');
    const crystalBtn = d.findButtonContaining('精の結晶 +1');
    console.log('[2] both choice buttons present:', !!slotBtn, !!crystalBtn);

    const metaBefore = d.readJSON(SAVE_KEY);
    await d.raceClicks(slotBtn, crystalBtn);
    await d.flush();

    const metaAfter = d.readJSON(SAVE_KEY);
    const slotsDelta = (metaAfter.slots || 0) - (metaBefore.slots || 0);
    const dewDelta = (metaAfter.dewBank || 0) - (metaBefore.dewBank || 0);
    console.log('[3] slots delta:', slotsDelta, '| dewBank delta:', dewDelta, '(expect exactly one of these to be +1, not both)');

    pass = (slotsDelta + dewDelta) === 1 && !(slotsDelta === 1 && dewDelta === 1);
    console.log(pass ? 'PASS' : 'FAIL: racing the shrine reward choice buttons applied both (or neither)');
  } finally {
    Date.now = origDateNow;
  }
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
