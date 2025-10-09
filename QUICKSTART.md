# Quick Start Guide - Kununu Badge Extension

## 🚀 Get Running in 2 Minutes

### Step 1: Load the Extension (30 seconds)

1. Open Chrome and go to: `chrome://extensions/`
2. Toggle **"Developer mode"** ON (top-right corner)
3. Click **"Load unpacked"**
4. Navigate to and select this folder: `CompanyLens`
5. ✅ Extension loaded!

### Step 2: Test on StepStone (1 minute)

1. Go to: https://www.stepstone.de
2. Search for any job (e.g., "Software Developer")
3. Click on a job listing
4. 👀 **Look for the badge!**

You should see a cyan badge with:
- **Icon:** White "K" on colored circle
- **Text:** "Kununu: —"
- **Position:** Near company name OR bottom-right corner

### Step 3: Try the Toggle (30 seconds)

1. Click the extension icon in Chrome toolbar (top-right)
2. Toggle **"Show badge on this tab"** OFF
3. Badge disappears ✨
4. Toggle it back ON
5. Badge reappears ✨

---

## ✅ What to Expect

### Badge Positions

**Mode 1: Inline (Preferred)**
- Badge appears near the company name/header
- Integrated into the page layout

**Mode 2: Floating (Fallback)**
- Badge appears in bottom-right corner
- Fixed position, stays visible when scrolling

### Visual Style

```
┌────────────────┐
│ K Kununu: —   │  ← Gradient cyan-to-teal background
└────────────────┘     White text, rounded corners
```

### Behavior

- ✓ Appears automatically on StepStone pages
- ✓ Updates when navigating between jobs (SPA support)
- ✓ Never appears twice
- ✓ No page slowdown
- ✓ No network calls

---

## 🔍 Quick Verification

Open DevTools (F12) and check:

1. **Console tab**: Look for `[Kununu Badge]` messages
   ```
   [Kununu Badge] Initializing on https://www.stepstone.de/...
   [Kununu Badge] Badge inserted in inline mode
   ```

2. **Elements tab**: Find `<div id="kununu-badge-host">`
   - Should contain `#shadow-root (closed)`
   - Badge HTML is inside shadow root

3. **Network tab**: Filter for extension traffic
   - Should show **ZERO requests**

---

## 🐛 Something Wrong?

### Badge Not Showing?

**Check:**
- [ ] Extension is enabled at `chrome://extensions/`
- [ ] You're on `*.stepstone.de` domain
- [ ] Page has fully loaded
- [ ] Toggle is ON (click extension icon to check)

**Fix:** Refresh page (Ctrl+R or F5)

### Console Errors?

- Open DevTools (F12) → Console tab
- Look for red error messages
- If you see errors, check:
  - All files are present
  - manifest.json is valid
  - Icons exist in icons/ folder

### Badge in Wrong Spot?

- **This is normal!** The extension has two modes:
  1. **Inline**: Near company (preferred)
  2. **Floating**: Bottom-right (fallback)
- If company element isn't detected, floating mode is used
- This ensures badge always appears

---

## 📚 Next Steps

**For Detailed Information:**
- **README.md** - Full documentation and architecture
- **TESTING.md** - Comprehensive testing guide (12 test cases)
- **FILES_CREATED.md** - Complete file manifest and code stats

**For Customization:**
- Edit `content/content.js` → `createBadgeContent()` for badge styling
- Edit `popup/popup.html` for popup appearance
- Edit `manifest.json` for extension metadata

**For Real Data Integration:**
- Current: Shows placeholder "—"
- Future: Add Kununu API integration or web scraping
- Badge structure ready for dynamic rating display

---

## 📋 Features Overview

| Feature | Status |
|---------|--------|
| Manifest V3 | ✅ |
| Shadow DOM Isolation | ✅ |
| Smart Badge Positioning | ✅ |
| SPA Navigation Support | ✅ |
| Per-Tab Toggle | ✅ |
| Zero Network Calls | ✅ |
| Performance Optimized | ✅ |
| Fully Documented | ✅ |

---

## 🎯 Testing Checklist

Quick 5-minute test:

- [ ] Extension loads without errors
- [ ] Badge appears on StepStone job page
- [ ] Badge text is "Kununu: —"
- [ ] Badge has cyan gradient background
- [ ] Clicking another job shows badge again (SPA test)
- [ ] Toggle OFF hides badge
- [ ] Toggle ON shows badge
- [ ] No console errors
- [ ] DevTools Network shows zero extension requests
- [ ] Shadow DOM exists (check Elements tab)

**All checked?** ✅ Extension is working perfectly!

---

## 🚨 Important Notes

1. **Placeholder Data**: Badge shows "—" (no real rating yet)
2. **StepStone Only**: Won't work on other sites
3. **No Data Collection**: Completely private, no tracking
4. **Session Storage**: Toggle state resets after closing browser
5. **Development Mode**: Chrome may show warnings (normal for unpacked extensions)

---

## 💡 Pro Tips

- **Keyboard Shortcut**: Set one at `chrome://extensions/shortcuts`
- **Pin Extension**: Right-click extension icon → "Pin"
- **Console Logging**: Useful for debugging, shows badge lifecycle
- **Popup Stays Open**: Click outside to close or press Esc

---

## 🔗 Quick Links

- Chrome Extensions: `chrome://extensions/`
- StepStone: https://www.stepstone.de
- DevTools: Press F12 or right-click → Inspect

---

## ✨ You're All Set!

The extension is production-ready and follows all best practices:
- Manifest V3 compliant
- Shadow DOM isolation
- Zero external dependencies
- Comprehensive error handling
- Performance optimized
- Privacy-focused

**Enjoy your new Kununu Badge extension!** 🎉

---

*Need help? Check README.md for troubleshooting or TESTING.md for detailed test procedures.*

