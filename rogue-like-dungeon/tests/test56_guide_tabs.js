// Feature (user-requested): the "遊び方" guide was rewritten as a tabbed reference (no forced
// reading order) with precise mechanic numbers. Smoke-test that all 5 tabs render without
// crashing and show their expected content, and that the weapon list uses the requested order
// (grouped by element, axe displayed before spear).
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

async function main() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true });
  await d.mount();
  await d.click(d.findButtonContaining('遊び方'));
  await d.flush();

  const tabs = [
    ['① 戦闘', '弱点'],
    ['② 武器', '会心'],
    ['③ 装備', '戦闘準備'],
    ['④ アイテム', 'レア度'],
    ['⑤ 死と継承', '継承'],
  ];
  let allTabsOk = true;
  for (const [tabLabel, expectText] of tabs) {
    await d.click(d.findButtonContaining(tabLabel));
    await d.flush();
    const ok = d.text().includes(expectText);
    console.log(`[tab ${tabLabel}] shows "${expectText}":`, ok);
    if (!ok) allTabsOk = false;
  }

  // Weapon tab: axe must appear before spear in reading order (element-grouped, per request).
  await d.click(d.findButtonContaining('② 武器'));
  await d.flush();
  const text = d.text();
  const axeIdx = text.indexOf('斧');
  const spearIdx = text.indexOf('槍');
  const axeBeforeSpear = axeIdx !== -1 && spearIdx !== -1 && axeIdx < spearIdx;
  console.log('[order] axe (斧) appears before spear (槍):', axeBeforeSpear, axeIdx, spearIdx);

  // Precise numbers requested must be present verbatim.
  const hasCrit = d.text().includes('1.8倍');
  const hasRandomArrow = d.text().includes('ランダムに1体選び');
  const hasStaffHeal = d.text().includes('最大HPの10%を回復');
  console.log('[numbers] crit multiplier (1.8倍) present:', hasCrit);
  console.log('[numbers] bow random-target wording present:', hasRandomArrow);
  console.log('[numbers] staff heal % present:', hasStaffHeal);

  // No screenshots anymore (dropped per user request) — the guide sheet must not contain <img>.
  const guideSheet = d.findButtonContaining('④ アイテム').closest('.kw-sheet');
  const noScreenshots = guideSheet.querySelectorAll('img').length === 0;
  console.log('[no-img] screenshots removed from the guide:', noScreenshots);

  // The tab bar must now be a horizontally-scrollable bottom bar, positioned structurally
  // AFTER the scrollable content area (not the old top-of-header wrapping row).
  const tabBtn = d.findButtonContaining('② 武器');
  const tabBar = tabBtn.parentElement.parentElement; // button -> nowrap row -> scroll wrapper
  const scrollArea = guideSheet.querySelector('[style*="overflow-y: auto"], [style*="overflowY"]');
  const tabBarAfterContent = scrollArea && scrollArea.compareDocumentPosition(tabBar) & Node.DOCUMENT_POSITION_FOLLOWING;
  const tabBarScrollsHorizontally = getComputedStyleLike(tabBar);
  console.log('[position] tab bar sits below the scrollable content (bottom bar):', !!tabBarAfterContent);
  console.log('[scroll] tab bar allows horizontal overflow scrolling:', tabBarScrollsHorizontally);

  function getComputedStyleLike(el) {
    // jsdom's el.style only reflects inline styles, which is exactly what we set here.
    return el.style.overflowX === 'auto';
  }

  const pass = allTabsOk && axeBeforeSpear && hasCrit && hasRandomArrow && hasStaffHeal
    && noScreenshots && !!tabBarAfterContent && tabBarScrollsHorizontally;
  console.log(pass ? 'PASS' : 'FAIL: guide tabs/content not as intended');
  process.exit(pass ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
