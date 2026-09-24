// UX polish (user-requested):
//   1. "戦闘を始める →" moved from the fixed header to a proper bottom footer of the gear-prep
//      screen (outside the scrolling item list, so it's always visible without scrolling).
//   2. Settings/SkillTree/遊び方 close buttons are no longer the loud yellow "primary" style —
//      they use the subdued "ghost" style like most other close buttons already did.
//   3. The skill-tree detail panel's "この結晶で習得する" button is centered, not left-aligned.
const { makeDriver } = require('./drive');
const SAVE_KEY = 'kiriwatari-forest-save';

async function testGearPrepFooterAtBottom() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true });
  await d.mount();
  await d.click('森 へ 入 る');
  await d.flush();
  await d.click('踏 み 入 れ る');
  await d.flush();

  const btn = d.findButtonContaining('戦闘を始める');
  console.log('[1] "戦闘を始める" button present:', !!btn);
  // It must now live in the fixed footer (sibling after the scrollable item-list div),
  // not inside the fixed header block that holds the HP bar.
  const sheet = btn.closest('.kw-sheet');
  const scrollArea = sheet.querySelector('[style*="overflow-y: auto"], [style*="overflowY"]');
  const inFooterAfterScrollArea = scrollArea && scrollArea.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING;
  console.log('[2] button sits after (below) the scrollable item list, not in the header:', !!inFooterAfterScrollArea);
  return !!btn && !!inFooterAfterScrollArea;
}

async function testCloseButtonsAreGhostNotPrimary() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true, dewBank: 50 });
  await d.mount();
  await d.click(d.findButtonContaining('遊び方'));
  await d.flush();
  // The 遊び方 close button is icon-only (an X glyph, no text label), so it can't be found by
  // text. (A plain findButtonContaining('閉じる') used to accidentally match the unrelated
  // period-limited event banner's own "閉じる" button whenever that banner happened to be
  // showing — this scopes to the guide overlay's own icon-only ghost button instead.)
  const guideClose = Array.from(d.container.querySelectorAll('.kw-overlay button.kw-btn.ghost'))
    .find((b) => b.querySelector('svg') && b.textContent.trim() === '');
  const guideCloseGhost = !!guideClose && guideClose.className.includes('ghost') && !guideClose.className.includes('primary');
  console.log('[3] 遊び方 close button uses ghost style (not the loud yellow primary):', guideCloseGhost);
  await d.click(guideClose);
  await d.flush();

  // The title-screen settings button is icon-only (a gear glyph, no text label).
  const gearBtn = Array.from(d.container.querySelectorAll('button.kw-btn.ghost'))
    .find((b) => b.querySelector('svg') && b.textContent.trim() === '');
  await d.click(gearBtn);
  await d.flush();
  const settingsClose = d.findButtonContaining('閉じる');
  const settingsCloseGhost = !!settingsClose && settingsClose.className.includes('ghost') && !settingsClose.className.includes('primary');
  console.log('[4] 設定 close button uses ghost style:', settingsCloseGhost);

  return guideCloseGhost && settingsCloseGhost;
}

async function testSkillAcquireButtonCentered() {
  const d = makeDriver();
  d.seed(SAVE_KEY, { slots: 1, checkpoint: 1, discovered: {}, skills: {}, everHadWeapon: true, dewBank: 50 });
  await d.mount();
  await d.click(d.findButtonContaining('スキルツリー'));
  await d.flush();
  // Skill rows are `<div role="button">`, not real <button> elements.
  const firstSkillButton = Array.from(d.container.querySelectorAll('[role="button"]')).find((b) => /結晶$/.test(b.textContent.trim()));
  console.log('[5] a buyable skill row was found to select:', !!firstSkillButton);
  if (firstSkillButton) { await d.click(firstSkillButton); await d.flush(); }

  const buyBtn = d.findButtonContaining('この結晶で習得する');
  console.log('[6] buy button found after selecting a skill:', !!buyBtn);
  const centered = buyBtn && buyBtn.parentElement.style.display === 'flex' && buyBtn.parentElement.style.justifyContent === 'center';
  console.log('[7] buy button wrapped in a centered flex container:', !!centered);
  return !!firstSkillButton && !!buyBtn && !!centered;
}

async function main() {
  const a = await testGearPrepFooterAtBottom();
  const b = await testCloseButtonsAreGhostNotPrimary();
  const c = await testSkillAcquireButtonCentered();
  console.log(a ? 'PASS: gear-prep "戦闘を始める" is a bottom footer button' : 'FAIL: gear-prep footer placement');
  console.log(b ? 'PASS: close buttons de-emphasized (ghost, not primary)' : 'FAIL: close button styling');
  console.log(c ? 'PASS: skill acquire button is centered' : 'FAIL: skill acquire button centering');
  process.exit(a && b && c ? 0 : 1);
}
main().catch((e) => { console.error('TEST ERROR', e); process.exit(1); });
