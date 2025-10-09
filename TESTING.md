# Testing Guide for Kununu Badge Extension

## Quick Start Testing

### 1. Load the Extension

```
1. Open Chrome
2. Navigate to chrome://extensions/
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select this folder: CompanyLens
6. Verify extension appears with no errors
```

### 2. Basic Functionality Test

**Navigate to StepStone:**
- Go to: https://www.stepstone.de
- Search for: "Software Developer" or any job
- Click on a job listing

**Expected Result:**
✓ Badge appears with text "Kununu: —"
✓ Badge has gradient blue background
✓ Badge shows "K" icon
✓ No console errors in DevTools

### 3. Badge Positioning Tests

#### Test Case 1: Inline Badge
**Steps:**
1. Open a job detail page on StepStone
2. Look for the badge near the company name/header area

**Expected:**
- Badge should be positioned near company information
- Should not overlap with page content
- Should be clearly visible

#### Test Case 2: Floating Badge (Fallback)
**Steps:**
1. If badge doesn't attach inline, it should float
2. Check bottom-right corner of the page

**Expected:**
- Badge appears fixed in bottom-right corner
- Maintains position when scrolling
- z-index keeps it above page content

### 4. Shadow DOM Isolation Test

**Steps:**
1. Open Chrome DevTools (F12)
2. Go to Elements tab
3. Find: `<div id="kununu-badge-host">`
4. Expand the element
5. Look for: `#shadow-root (closed)`

**Expected:**
✓ Shadow root is present and marked as "closed"
✓ Badge HTML is inside shadow root
✓ Styles are scoped within shadow root

**Verify Isolation:**
```javascript
// Run in console - should NOT affect badge
document.querySelector('#kununu-badge-host').style.display = 'none';
// Badge should still be visible because styles are in shadow DOM
```

### 5. SPA Navigation Test

**Steps:**
1. Open any job listing on StepStone
2. Note the badge position
3. Click "Back to results" (if available)
4. Click another job listing
5. Observe badge behavior

**Expected:**
✓ Badge disappears during navigation
✓ Badge reappears on new job page (within ~300ms)
✓ Only one badge instance visible
✓ No duplicate badges

### 6. Toggle Functionality Test

**Steps:**
1. With StepStone page open, click extension icon in toolbar
2. Popup should appear
3. Toggle "Show badge on this tab" OFF
4. Badge should disappear from page
5. Toggle back ON
6. Badge should reappear

**Expected:**
✓ Popup opens without errors
✓ Toggle state reflects current badge visibility
✓ Badge responds immediately to toggle changes
✓ State persists for current tab session

### 7. Multi-Tab Test

**Steps:**
1. Open two StepStone job pages in separate tabs
2. Disable badge in Tab 1 (via popup)
3. Switch to Tab 2
4. Badge should still be visible
5. Toggle Tab 2's badge OFF
6. Switch back to Tab 1
7. Badge should still be disabled

**Expected:**
✓ Each tab maintains independent badge state
✓ Toggling one tab doesn't affect others
✓ SessionStorage properly isolates tab states

### 8. Performance Test

**Steps:**
1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Click "Record"
4. Load a StepStone job page
5. Stop recording after page loads
6. Find "content.js" execution time

**Expected:**
✓ Content script execution < 5ms
✓ No layout shifts (check "Experience" section)
✓ No forced reflows or layout thrashing
✓ MutationObserver callbacks < 2ms each

### 9. Network Privacy Test

**Steps:**
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Clear network log
4. Navigate to StepStone page
5. Open multiple job listings
6. Filter by extension name or check all requests

**Expected:**
✓ Zero network requests from extension
✓ No XHR/Fetch calls to external domains
✓ No WebSocket connections
✓ No data transmission of any kind

### 10. Console Logging Test

**Steps:**
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Filter for: `[Kununu Badge]`
4. Load a StepStone page

**Expected Messages:**
```
[Kununu Badge] Initializing on https://www.stepstone.de/...
[Kununu Badge] MutationObserver initialized
[Kununu Badge] Badge inserted in inline mode
// or
[Kununu Badge] Badge inserted in floating mode
```

### 11. Error Handling Test

#### Test Case 1: Non-StepStone Page
**Steps:**
1. Navigate to google.com
2. Click extension icon

**Expected:**
✓ Popup shows "Not on a StepStone page"
✓ Toggle is disabled
✓ No badge appears on page

#### Test Case 2: StepStone Homepage (No Job)
**Steps:**
1. Go to www.stepstone.de (homepage)
2. Observe badge behavior

**Expected:**
✓ Badge may not appear (no company to attach to)
✓ OR badge appears in floating mode
✓ No console errors

### 12. Browser Restart Test

**Steps:**
1. Enable badge on a StepStone tab
2. Note the URL
3. Close Chrome completely
4. Reopen Chrome
5. Navigate to the same URL
6. Click extension icon

**Expected:**
✓ Extension still loads correctly
✓ Badge appears by default (sessionStorage cleared)
✓ Toggle works as expected

## Automated Testing Checklist

- [ ] Extension loads without warnings
- [ ] Manifest V3 validation passes
- [ ] Badge appears on StepStone pages
- [ ] Shadow DOM properly isolates styles
- [ ] MutationObserver handles SPA navigation
- [ ] Toggle popup works correctly
- [ ] Per-tab state is isolated
- [ ] No network requests are made
- [ ] No console errors
- [ ] Performance < 5ms
- [ ] No duplicate badges
- [ ] Idempotency maintained

## Common Issues & Solutions

### Badge Not Appearing
**Solution:**
1. Check extension is enabled at chrome://extensions/
2. Refresh the page (Ctrl+R)
3. Check console for error messages
4. Verify you're on *.stepstone.de domain

### Popup Says "Not on StepStone page"
**Solution:**
- This is normal for non-StepStone pages
- Navigate to www.stepstone.de and try again

### Badge Appears in Wrong Position
**Solution:**
- This is expected behavior (fallback mode)
- The extension tries multiple selectors
- If company element isn't found, badge floats
- This is by design for robustness

### Multiple Badges Appearing
**Solution:**
- Shouldn't happen (idempotency checks in place)
- If it does: Refresh page and report as bug
- Check console for error messages

## Test Results Template

```
Date: ___________
Tester: ___________
Chrome Version: ___________

[ ] Load Extension - PASS/FAIL
[ ] Basic Functionality - PASS/FAIL
[ ] Badge Positioning - PASS/FAIL
[ ] Shadow DOM Isolation - PASS/FAIL
[ ] SPA Navigation - PASS/FAIL
[ ] Toggle Functionality - PASS/FAIL
[ ] Multi-Tab Independence - PASS/FAIL
[ ] Performance < 5ms - PASS/FAIL
[ ] Zero Network Calls - PASS/FAIL
[ ] Console Logging - PASS/FAIL
[ ] Error Handling - PASS/FAIL

Notes:
_______________________________________
_______________________________________
```

## Advanced Testing

### Memory Leak Test
1. Open Chrome Task Manager (Shift+Esc)
2. Find extension process
3. Navigate 10+ job pages
4. Check memory usage doesn't grow unbounded

### Rapid Navigation Test
1. Open job listing
2. Quickly navigate back and forth between jobs
3. Badge should handle debouncing correctly
4. No "flashing" or multiple badge instances

### Mobile Emulation Test
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device
4. Test badge responsiveness

---

**Testing Complete!** 🎉

If all tests pass, the extension is ready for production use on StepStone.

