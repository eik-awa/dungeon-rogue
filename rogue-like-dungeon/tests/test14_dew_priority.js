// Scenario (S-2, priority bug): itemScore() checked `c.kind === "meta"` for 宝樹の雫, but
// dew's real CONSUMABLES kind is "orb" ("meta" doesn't exist as a kind anywhere in the code).
// So the dew scored 14 (near-lowest, same tier as a common consumable) instead of 10000, and
// was never auto-selected for inheritance ahead of ordinary gear on the death/rebirth screen.
const { makeDriver, SAVE_KEY, RUN_SAVE_KEY } = require('./drive');

(async () => {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, skillTreeGen: 3 });
  d.seed(RUN_SAVE_KEY, {
    phase: 'dead', floor: 9,
    weapons: [{ id: 'wA', kind: 'weapon', type: 'dagger', name: '普通の短剣', rarity: 'common', atk: 20, asset: 'dagger' }],
    armor: { helm: null, armor: null, charm: null },
    inv: [
      { id: 'dewA', kind: 'item', itemId: 'dew', name: '宝樹の雫', rarity: 'legend', asset: 'dew' },
      { id: 'mhA', kind: 'item', itemId: 'mossHeart', name: '苔の心臓', rarity: 'legend', asset: 'mossHeart' },
    ],
    orbBagBonus: 0, orbSlotBonus: 0,
  });

  await d.mount();
  await d.click('転生を選ぶ');
  await d.flush();

  const t = d.text();
  const dewPicked = t.includes('✓ 結晶にする');
  console.log('継承枠 = 1、自動選択されるのは…');
  console.log('  宝樹の雫が選ばれている :', dewPicked, dewPicked ? '' : ' <-- BUG (コメントは雫・心臓は最優先だが実際は違う)');
  console.log('  苔の心臓/武器が選ばれている:', t.includes('✓ 持っていく'));
  console.log(dewPicked ? 'PASS' : 'FAIL: dew was not prioritized for inheritance');
  process.exit(dewPicked ? 0 : 1);
})();
