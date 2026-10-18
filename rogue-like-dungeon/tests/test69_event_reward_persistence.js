// Shrine event reward bugs:
//  - convert one first, then double with the ad: the 2nd reward was never persisted (lost on ×)
//  - leftover unclaimed reward from the previous day was overwritten by the next day's challenge
//  - re-entering after the ad-doubling showed the ad button again (watching it gave nothing)
const { makeDriver, skipIfEventDisabled } = require('./drive');
const { act } = require('react-dom/test-utils');
skipIfEventDisabled();
const SAVE_KEY = 'kiriwatari-forest-save';
const EVENT_JST_OFFSET = 9 * 3600_000;
const FIXED_NOW = new Date('2026-10-20T12:00:00Z').getTime();
const eventJstDay = (t) => new Date(t + EVENT_JST_OFFSET).toISOString().slice(0, 10);

async function open(seedMeta) {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, eventSeenMax: FIXED_NOW, ...seedMeta });
  await d.mount();
  await d.flush();
  await d.click('宝 樹 の 祠');
  await d.flush();
  return d;
}

async function main() {
  const origDateNow = Date.now;
  Date.now = () => FIXED_NOW;
  const results = [];
  const check = (label, ok, detail) => { console.log(`${ok ? 'ok ' : 'NG '} ${label}`, detail === undefined ? '' : detail); results.push(ok); };
  try {
    const today = eventJstDay(FIXED_NOW);

    // [A] play the shrine for real (challenge -> approach x3 -> reward), convert one first, then double
    //     with the ad -> the 2nd reward must be persisted
    {
      const d = await open({});
      await d.click('挑 戦 す る');
      await d.flush();
      for (let i = 0; i < 6 && !d.text().includes('使いみちを選んでください'); i++) {
        const btn = d.findButtonContaining('捕 ま え る') || d.findButtonContaining('近 づ く');
        if (!btn) break;
        await d.click(btn);
        await d.flush();
      }
      check('reached the reward screen by playing the shrine', d.text().includes('使いみちを選んでください'));
      await d.click('精の結晶 +1');
      await d.flush();
      check('after the first convert eventReward is cleared (1 reward only)', d.readJSON(SAVE_KEY).eventReward === null);
      await d.click('広告を見て報酬を2倍にする');
      await act(async () => { d.env.window.__onRewardAdResult__('eventDew', 'rewarded'); });
      await d.flush();
      const m = d.readJSON(SAVE_KEY);
      check('doubling after converting persists the remaining reward', !!m.eventReward && m.eventReward.reward2x === true && (m.eventReward.converted || []).length === 1, JSON.stringify(m.eventReward));
    }

    // [B] re-entering after doubling: the ad button is gone, the 2nd reward is still claimable
    {
      const d = await open({ eventDay: today, eventReward: { converted: ['crystal'], reward2x: true } });
      check('re-entering after doubling: no ad button', !d.findButtonContaining('広告を見て報酬を2倍にする'));
      check('re-entering after doubling: 2nd reward claimable', !!d.findButtonContaining('継承枠 +1'));
      await d.click('継承枠 +1');
      await d.flush();
      const m = d.readJSON(SAVE_KEY);
      check('claiming the 2nd reward grants it and clears the leftover', m.slots === 2 && m.eventReward === null, [m.slots, m.eventReward]);
    }

    // [C] leftover reward from yesterday is shown first and not overwritten by a new challenge
    {
      const yesterday = eventJstDay(FIXED_NOW - 24 * 3600_000);
      const d = await open({ eventDay: yesterday, eventReward: { converted: [], reward2x: false } });
      check('yesterday\'s unclaimed reward is restored instead of the intro', d.text().includes('使いみちを選んでください') && !d.findButtonContaining('挑 戦 す る'));
      await d.click('精の結晶 +1');
      await d.flush();
      check('leftover reward can be claimed', (d.readJSON(SAVE_KEY).dewBank || 0) === 1 && d.readJSON(SAVE_KEY).eventReward === null);
    }
  } finally {
    Date.now = origDateNow;
  }
  const pass = results.every(Boolean);
  console.log(pass ? 'PASS' : 'FAIL');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
