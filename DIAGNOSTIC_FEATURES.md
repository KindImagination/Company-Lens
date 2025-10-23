# Diagnostic Features - Company Lens

## New Features Added

### 1. ✅ Copy Diagnostics Button

**What it does:**
- Copies all diagnostic information to clipboard as formatted text
- One-click operation
- Includes all extraction data, elements, errors

**How to use:**
1. Enable Diagnostics mode in popup
2. Open diagnostics overlay on job page
3. Click "📋 Copy" button in header
4. Diagnostics copied to clipboard!
5. Paste anywhere (Notepad, email, bug report, etc.)

**What gets copied:**
```
=== Company Lens Diagnostics ===

Timestamp: 2025-10-23T...
URL: https://...
Page Type: job-detail
Job Detail Page: Yes
Badge Enabled: Yes

--- Elements ---
Indeed Company (.e1wnkr790): Found
  Company Name: Google Germany GmbH
StepStone Job Ad (.job-ad-display-du9bhi): Not found
Existing Badge: Present

--- Company Extraction ---
Success: Yes
Extracted Name: Google Germany GmbH
Anchor: DIV.e1wnkr790
Detected Suffixes: GMBH

--- Job Extraction ---
Success: Yes
Title: Senior Software Engineer
Company: Google Germany GmbH
Description Length: 2847 characters
Requirements Length: 543 characters

Description Preview (first 500 chars):
About the job
We're looking for talented...
[...]

--- Anchor ---
Found: Yes
Element: DIV.e1wnkr790
Mode: inline

=== End of Diagnostics ===
```

**Visual Feedback:**
- Button text changes to "✓ Copied!" for 2 seconds
- Console log confirms copy
- Alert if copy fails

---

### 2. ✅ Visual Extraction Highlights

**What it does:**
- Shows exactly which elements the app extracts
- Color-coded overlays with labels
- Semi-transparent (can see through)
- Toggle on/off as needed

**How to use:**
1. Enable Diagnostics mode
2. Open diagnostics overlay
3. Click "👁️ Highlights" button
4. See visual overlays on page!
5. Click again to hide: "👁️ Hide"

**What gets highlighted:**

| Element | Color | Label Example |
|---------|-------|---------------|
| Job Description | 🟢 Green (30% opacity) | `Job Description (.eu4oa1w0)` |
| Company Name | 🔵 Blue (30% opacity) | `Company Name (.e1wnkr790)` |
| Job Title | 🟡 Amber (30% opacity) | `Job Title (h1.jobsearch-JobInfoHeader-title)` |

**Features:**
- ✅ Semi-transparent overlays (30% opacity)
- ✅ Can see page content through highlights
- ✅ Shows exact CSS selector used
- ✅ Border with solid color for visibility
- ✅ Label above each highlighted area
- ✅ Automatically removed when toggling off
- ✅ Removed when closing diagnostics

**Visual Example:**
```
┌────────────────────────────────────────┐
│ [Job Title (h1.jobsearch...)]   ← Amber label
│ ╔══════════════════════════════════╗
│ ║ Senior Software Engineer         ║ ← Yellow highlight
│ ╚══════════════════════════════════╝
│
│ [Company Name (.e1wnkr790)]      ← Blue label
│ ╔═══════════════════╗
│ ║ Google Germany    ║              ← Blue highlight
│ ╚═══════════════════╝
│
│ [Job Description (.eu4oa1w0)]    ← Green label
│ ╔══════════════════════════════════╗
│ ║ About the job                    ║
│ ║ We're looking for talented       ║ ← Green highlight
│ ║ engineers to join our team...    ║
│ ║ Requirements:                    ║
│ ║ - 5+ years experience...         ║
│ ╚══════════════════════════════════╝
└────────────────────────────────────────┘
```

---

## Button States

### Copy Button
- **Default**: `📋 Copy`
- **After Click**: `✓ Copied!` (for 2 seconds)
- **Error**: Alert with error message

### Highlights Button
- **Default**: `👁️ Highlights`
- **Active**: `👁️ Hide` (green background)
- **Toggle**: Click to switch states

---

## Technical Implementation

### Copy Functionality

**Function**: `copyDiagnosticsToClipboard()`

1. Gathers diagnostics via `window.gatherBadgeDiagnostics()`
2. Formats as structured text
3. Uses `navigator.clipboard.writeText()`
4. Shows visual feedback
5. Logs to console

**Error Handling:**
- Checks if diagnostics available
- Try/catch for clipboard API
- Alerts user on failure
- Logs errors to console

### Highlight Functionality

**Functions:**
- `toggleExtractionHighlights()` - Toggles on/off
- `showExtractionHighlights()` - Creates overlays
- `hideExtractionHighlights()` - Removes overlays

**How it works:**
1. Searches for elements using same selectors as extraction
2. Gets bounding rectangles via `getBoundingClientRect()`
3. Creates fixed-position overlay divs
4. Adds semi-transparent background
5. Adds label with selector info
6. Appends to document body
7. Stores references for cleanup

**Selectors Used:**

Job Description:
```javascript
'.eu4oa1w0',
'#jobDescriptionText',
'div[id*="jobDescription"]',
'.jobsearch-jobDescriptionText',
'[data-at="jobad-description"]'
```

Company Name:
```javascript
'.e1wnkr790',
'.job-ad-display-du9bhi',
'[data-at="header-company-name"]'
```

Job Title:
```javascript
'h1[data-at="header-job-title"]',
'h1.jobsearch-JobInfoHeader-title',
'h1[class*="job-title"]'
```

---

## CSS Styles Added

```css
.diag-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.diag-action-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.diag-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.diag-action-btn--active {
  background: rgba(76, 175, 80, 0.8); /* Green when active */
}
```

---

## Testing Instructions

### Test Copy Feature

1. **Setup:**
   - Reload extension
   - Go to Indeed or StepStone job page
   - Enable Diagnostics in popup

2. **Test Copy:**
   - Click "📋 Copy" button
   - Should show "✓ Copied!" for 2 seconds
   - Open Notepad/text editor
   - Paste (Ctrl+V)
   - Verify all diagnostic info present

3. **Expected Output:**
   ```
   === Company Lens Diagnostics ===
   [All diagnostic data formatted as text]
   === End of Diagnostics ===
   ```

### Test Highlights Feature

1. **Setup:**
   - Same as above
   - Make sure diagnostics overlay is open

2. **Test Show Highlights:**
   - Click "👁️ Highlights" button
   - Button should turn green and say "👁️ Hide"
   - See colored overlays appear on page:
     - Green on job description
     - Blue on company name
     - Amber on job title
   - Labels should show above each highlight
   - Should be semi-transparent (can read text)

3. **Test Hide Highlights:**
   - Click "👁️ Hide" button
   - Button returns to normal "👁️ Highlights"
   - All overlays disappear

4. **Test Auto-Cleanup:**
   - Show highlights
   - Close diagnostics overlay (X button or ESC)
   - Highlights should auto-remove
   - No leftover overlays on page

### Test Edge Cases

**No Elements Found:**
- On non-job page, enable diagnostics
- Click Highlights - should not crash
- Console may show "0 extraction highlights"

**Small Elements:**
- Highlights should still appear correctly
- Labels might extend beyond element

**Scrolling:**
- Highlights use `fixed` positioning
- May not follow scroll perfectly
- This is expected for debugging

---

## Debugging

### Console Commands

**Check if functions exist:**
```javascript
console.log('gatherBadgeDiagnostics:', typeof window.gatherBadgeDiagnostics);
```

**Manually trigger copy:**
```javascript
// In diagnostics overlay context
copyDiagnosticsToClipboard();
```

**Check highlights state:**
```javascript
console.log('Highlights visible:', highlightsVisible);
console.log('Active overlays:', highlightOverlays.length);
```

### Common Issues

**Copy doesn't work:**
- Check clipboard permissions
- Some browsers require HTTPS
- Check console for errors

**Highlights not showing:**
- Check if elements exist on page
- Open console, look for selector matches
- Try on different job site (Indeed vs StepStone)

**Highlights stay after closing:**
- Reload page
- Should not happen (bug if it does)
- Check console for errors

---

## Use Cases

### For Developers

1. **Debugging Extraction:**
   - See exactly what elements are found
   - Verify correct selector is used
   - Check if multiple elements match

2. **Testing New Sites:**
   - Add new job site support
   - Use highlights to verify selectors
   - See what gets extracted

3. **Bug Reports:**
   - Copy diagnostics
   - Share with team
   - Includes all relevant info

### For QA Testing

1. **Verify Functionality:**
   - Confirm extraction works
   - Visual verification with highlights
   - Copy results for documentation

2. **Cross-Site Testing:**
   - Test on Indeed DE, Indeed US, etc.
   - Verify different layouts
   - Document selector variations

### For Support

1. **User Reports:**
   - Ask user to copy diagnostics
   - Get exact error state
   - Reproduce issue

2. **Site Changes:**
   - Job sites update layouts
   - Quickly identify broken selectors
   - Update extraction code

---

## Files Modified

**Only one file changed:**
- ✅ `content/diagnostics.js` - Added copy and highlight features

**Lines Added:** ~300 lines
- Copy function: ~110 lines
- Highlight functions: ~180 lines
- CSS styles: ~40 lines

---

## Benefits

### Copy Feature Benefits:
1. ✅ Easy sharing of diagnostic data
2. ✅ No need to screenshot
3. ✅ Formatted, readable text
4. ✅ Complete information captured
5. ✅ One-click operation

### Highlight Feature Benefits:
1. ✅ Visual verification of extraction
2. ✅ Instant debugging feedback
3. ✅ No need to inspect DOM
4. ✅ See exactly what app sees
5. ✅ Toggle on/off as needed
6. ✅ Non-intrusive (semi-transparent)
7. ✅ Shows exact selectors used

---

## Future Enhancements

### Potential Additions:
- [ ] Export diagnostics as JSON file
- [ ] Copy individual sections
- [ ] Highlight persistence on scroll
- [ ] Click highlight to jump to element
- [ ] Show extraction order (1, 2, 3...)
- [ ] Different colors for different states
- [ ] Highlight preview in diagnostics panel

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Close Diagnostics | ESC |
| Copy (when focused) | (manual click only) |
| Toggle Highlights | (manual click only) |

---

**Both features are now ready for testing!** 🎉

Reload the extension and try them out on a job page with diagnostics enabled.

