# Testing CV Comparison - Complete Walkthrough

This guide walks you through testing the complete CV comparison feature from start to finish.

## Prerequisites Checklist

Before testing, ensure:

- [x] Libraries downloaded (run `setup-libraries.ps1` or manually download)
- [x] Extension loaded in Chrome (`chrome://extensions/`)
- [x] Extension reloaded after adding libraries (click reload button 🔄)
- [x] DeepSeek API key ready (from https://platform.deepseek.com)
- [x] Test CV file ready (PDF or DOCX)
- [x] Chrome version 114+ for side panel support

## Step-by-Step Testing Process

### 1. Verify Libraries Are Loaded

**Open Browser Console:**
1. Click Company Lens extension icon
2. Right-click in the popup → "Inspect"
3. Go to Console tab
4. Look for any library loading errors

**Expected Result:**
- No "PDF.js library not loaded" errors
- No "Mammoth.js library not loaded" errors

**If you see errors:**
- Verify files exist in `lib/` folder:
  - `pdf.min.js` (~320KB)
  - `pdf.worker.min.js` (~1MB)
  - `mammoth.browser.min.js` (~640KB)
- Reload extension: Go to `chrome://extensions/` → Click 🔄 next to Company Lens
- Restart Chrome if needed

### 2. Test CV Upload (PDF)

**Steps:**
1. Click Company Lens extension icon
2. Click "📄 Upload CV (PDF/DOCX)" button
3. Select a PDF CV file
4. Wait for parsing (1-5 seconds)

**Expected Results:**
- ✅ Status message: "Parsing CV..."
- ✅ Then: "CV uploaded successfully!"
- ✅ CV status appears showing:
  - Filename
  - File size in KB
  - Upload date
- ✅ No error messages

**Troubleshooting:**
- **"PDF appears to be empty"**: Your PDF is scanned/image-based. Use a text-based PDF.
- **"File too large"**: Compress PDF to under 10MB.
- **"PDF.js library not loaded"**: Reload extension, verify libraries are in `lib/` folder.

### 3. Test CV Upload (DOCX)

**Steps:**
1. Click Company Lens extension icon
2. Click "📄 Upload CV (PDF/DOCX)" button
3. Select a DOCX CV file
4. Wait for parsing (1-3 seconds)

**Expected Results:**
- ✅ Status message: "Parsing CV..."
- ✅ Then: "CV uploaded successfully!"
- ✅ CV status appears with file details
- ✅ No error messages

**Troubleshooting:**
- **"DOCX appears to be empty"**: File may be corrupted. Try saving as new DOCX.
- **"Mammoth.js library not loaded"**: Reload extension, verify libraries.

### 4. Test API Key Setup

**Steps:**
1. In popup, find "DeepSeek API Key" section
2. Enter your API key (starts with `sk-`)
3. Click "Save" button

**Expected Results:**
- ✅ Status message: "API key saved!"
- ✅ API key status shows: "✓ API key set: sk-xxxxx...xxxx" (masked)
- ✅ Input field shows "API key is set" placeholder
- ✅ Compare button updates (if on job page)

**Troubleshooting:**
- **"Invalid API key format"**: Key must start with `sk-`
- **"Please enter an API key"**: Field is empty
- Get API key from: https://platform.deepseek.com

### 5. Test Compare Button State

**Test on non-job page:**
1. Navigate to Google or any non-job site
2. Click Company Lens extension icon
3. Observe Compare button

**Expected:**
- ✅ Button is DISABLED
- ✅ Help text: "Navigate to a job page to compare"

**Test on job page:**
1. Navigate to StepStone or Indeed
2. Open any job detail page
3. Click Company Lens extension icon
4. Observe Compare button

**Expected:**
- ✅ Button is ENABLED (if CV and API key are set)
- ✅ Help text: "Ready to compare!"

**Test without CV:**
1. Delete CV (click "Delete CV" button)
2. Check Compare button

**Expected:**
- ✅ Button is DISABLED
- ✅ Help text: "Upload CV to enable comparison"

**Test without API key:**
1. Upload CV
2. Don't set API key (or clear browser data)
3. Check Compare button

**Expected:**
- ✅ Button is DISABLED
- ✅ Help text: "Set API key to enable comparison"

### 6. Test Job Extraction (StepStone)

**Setup:**
1. Navigate to https://www.stepstone.de
2. Search for any job (e.g., "Software Engineer")
3. Click on a job detail page

**Open DevTools Console:**
1. Press F12
2. Go to Console tab
3. Click Company Lens icon → Compare button

**Expected Console Logs:**
```
[Company Lens] Starting CV comparison...
[Company Lens] Job extracted: [Job Title]
```

**Verify Extraction:**
- Job title extracted correctly
- Company name extracted
- Description has substantial content (>100 characters)

**If extraction fails:**
- Check console for errors
- Verify you're on a job detail page (not search results)
- Try refreshing the page
- Try a different job listing

### 7. Test Job Extraction (Indeed)

**Setup:**
1. Navigate to https://www.indeed.com or https://de.indeed.com
2. Search for any job
3. Click on a job detail page

**Test same as StepStone above**

**Expected:**
- Job data extracted successfully
- Console shows job title

### 8. Test Full Comparison Flow

**Prerequisites:**
- CV uploaded ✓
- API key saved ✓
- On a job detail page ✓

**Steps:**
1. Click Company Lens extension icon
2. Click "🔍 Compare with Job" button
3. Wait for processing

**Expected Behavior:**

**Phase 1 - Immediate (< 1 second):**
- ✅ Status message: "Starting comparison..."
- ✅ Popup may close automatically
- ✅ Side panel opens (or attempts to open)

**Phase 2 - Loading (10-20 seconds):**
- ✅ Side panel shows loading state
- ✅ Loading spinner visible
- ✅ Text: "Analyzing your CV against the job description..."
- ✅ Subtext: "This may take 10-20 seconds"

**Phase 3 - Results Display:**
- ✅ Loading state disappears
- ✅ Results state appears with:
  - Job title and company
  - Match score circle (animated)
  - Score number (0-100%)
  - Score color (red/orange/green)
  - Summary text
  - Matching skills (green tags)
  - Missing skills (orange tags)
  - Quick recommendations

**Phase 4 - Interaction:**
- ✅ Can switch between "Summary View" and "Detailed Analysis" tabs
- ✅ Detailed view shows:
  - Strengths section
  - Gaps section
  - Experience assessment
  - Education assessment
  - All recommendations
- ✅ Can close side panel

### 9. Test Error Scenarios

**Test: Invalid API Key**
1. Save an invalid API key (e.g., "test123")
2. Try to compare

**Expected:**
- ✅ Error state in side panel
- ✅ Message: "Invalid API key..."

**Test: Network Error**
1. Disconnect internet
2. Try to compare

**Expected:**
- ✅ Error state
- ✅ Message: "Network error..."

**Test: Rate Limit**
1. Make multiple comparisons quickly
2. Continue until rate limited

**Expected:**
- ✅ Error message: "Rate limit exceeded..."

**Test: No Job Description**
1. Navigate to job search results page (not detail)
2. Try to compare

**Expected:**
- ✅ Error: "Could not extract job description from this page"

### 10. Test Data Persistence

**Test: CV Persists After Extension Reload**
1. Upload CV
2. Close popup
3. Reload extension (`chrome://extensions/` → 🔄)
4. Open popup again

**Expected:**
- ✅ CV status still shows
- ✅ File details preserved

**Test: API Key Persists**
1. Save API key
2. Close Chrome completely
3. Reopen Chrome
4. Open popup

**Expected:**
- ✅ API key status shows "✓ API key set"

**Test: Delete CV**
1. Click "Delete CV" button
2. Confirm deletion
3. Observe status

**Expected:**
- ✅ Confirmation dialog appears
- ✅ CV status disappears
- ✅ Status message: "CV deleted"
- ✅ Compare button becomes disabled

### 11. Performance Testing

**Test: Large CV (3-4 MB)**
1. Upload a large PDF CV (~4MB)
2. Time the parsing

**Expected:**
- ✅ Completes in under 10 seconds
- ✅ No memory issues
- ✅ CV stores successfully

**Test: Multiple Comparisons**
1. Run 3-5 comparisons on different jobs
2. Monitor performance

**Expected:**
- ✅ Each comparison completes in 10-20 seconds
- ✅ No slowdown between comparisons
- ✅ No memory leaks

### 12. Browser Compatibility

**Test: Side Panel Support**
1. Check Chrome version: `chrome://version/`
2. Version 114+: Side panel should work
3. Version <114: May fallback or show error

**Test: Different Screen Sizes**
1. Resize browser window
2. Open side panel
3. Check responsive design

**Expected:**
- ✅ Side panel adapts to different widths
- ✅ Text remains readable
- ✅ Buttons accessible

## Common Issues & Solutions

### Issue: Libraries Not Loading

**Symptoms:**
- Error: "PDF.js library not loaded"
- CV upload fails immediately

**Solutions:**
1. Verify files in `lib/` folder:
   ```bash
   ls -la lib/
   # Should show: pdf.min.js, pdf.worker.min.js, mammoth.browser.min.js
   ```
2. Check file sizes (shouldn't be tiny placeholder files)
3. Reload extension: `chrome://extensions/` → 🔄
4. Clear browser cache
5. Restart Chrome

### Issue: Side Panel Won't Open

**Symptoms:**
- Comparison starts but no side panel
- Console error about side panel

**Solutions:**
1. Check Chrome version (need 114+)
2. Check `chrome://flags` for side panel flags
3. Try opening manually: Right-click extension icon → "Side panel"
4. Check browser console for errors

### Issue: Comparison Takes Too Long

**Symptoms:**
- Loading for >30 seconds
- Eventually times out

**Solutions:**
1. Check internet connection
2. Verify DeepSeek API status
3. Try a simpler/shorter job description
4. Check DeepSeek account quota

### Issue: Match Score Seems Wrong

**Symptoms:**
- Score doesn't match expectations
- Skills mismatch

**Solutions:**
1. This is AI-generated - results may vary
2. Try rewording CV or use different format
3. Check if CV parsed correctly (file too large?)
4. Provide more detailed CV

## Success Criteria

A complete successful test includes:

- [x] PDF upload works
- [x] DOCX upload works
- [x] API key saves and loads
- [x] Compare button states correct
- [x] Job extraction works (StepStone)
- [x] Job extraction works (Indeed)
- [x] Full comparison completes
- [x] Side panel displays results
- [x] Match score animates
- [x] Skills lists populate
- [x] Recommendations show
- [x] Tab switching works
- [x] Can close side panel
- [x] CV persists after reload
- [x] Delete CV works
- [x] No console errors
- [x] Performance acceptable

## Debug Console Commands

Open popup, then Console (F12), and try:

```javascript
// Check if libraries loaded
console.log('PDF.js:', typeof pdfjsLib);
console.log('Mammoth:', typeof mammoth);
console.log('parseCV:', typeof parseCV);
console.log('storeCV:', typeof storeCV);

// Check storage
chrome.storage.local.get(null, (data) => console.log('Storage:', data));

// Test CV parsing manually
// (Upload file via UI, then check console)
```

## Reporting Issues

If you encounter issues, collect:

1. Chrome version: `chrome://version/`
2. Extension version: Check popup footer
3. Console errors: F12 → Console → Copy all errors
4. Steps to reproduce
5. Expected vs actual behavior

---

**Happy Testing!** 🚀

This testing process ensures all features work correctly before real-world use.

