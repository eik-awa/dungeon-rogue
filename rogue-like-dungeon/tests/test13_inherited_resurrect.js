// Scenario (S-1, duplication): startFromChapter() clears meta.inherited, but enterNode()
// (called right after, in the same synchronous flow) used to write { ...meta(stale closure),
// seen } — resurrecting the just-consumed inherited list, because the outer `meta` closure
// variable doesn't reflect setMeta() calls until the next render. Fixed by routing every meta
// write through updateMeta(), which keeps metaRef.current authoritative synchronously.
const { makeDriver, SAVE_KEY } = require('./drive');

(async () => {
  const d = makeDriver();
  const w = { id: 'wINH', kind: 'weapon', type: 'dagger', name: '継承の短剣', rarity: 'legend', atk: 999, asset: 'dagger' };
  d.seed(SAVE_KEY, {
    slots: 3, deaths: 1, bestFloor: 5, clears: 0, bonusHp: 0,
    inherited: [w], checkpoint: 1, dewBank: 0, skills: {},
    mossHeartStages: [], skillTreeGen: 3,
  });
  await d.mount();
  await d.flush(50);

  await d.click('森 へ 入 る');          // -> startFromChapter(0)
  await d.flush(120);

  const meta = d.readJSON(SAVE_KEY);
  const stillThere = (meta.inherited || []).some((x) => x.id === 'wINH');
  console.log('meta.seen written?          :', !!meta.seen && Object.keys(meta.seen).length > 0);
  console.log('meta.inherited after start  :', JSON.stringify(meta.inherited));
  console.log('inherited RESURRECTED?      :', stillThere, stillThere ? ' <-- BUG' : ' (ok)');
  console.log(!stillThere ? 'PASS' : 'FAIL: inherited item resurrected after being consumed');
  process.exit(stillThere ? 1 : 0);
})();
