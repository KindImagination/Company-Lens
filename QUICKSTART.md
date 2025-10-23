# Company Lens - Quick Start Guide

Get up and running with Company Lens in 5 minutes!

## Step 1: Install Required Libraries (2 minutes)

Download the parsing libraries needed for CV upload:

```bash
# Navigate to the lib/ directory
cd lib/

# Download PDF.js (for PDF parsing)
curl -o pdf.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js
curl -o pdf.worker.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js

# Download Mammoth.js (for DOCX parsing)
curl -o mammoth.browser.min.js https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js
```

**Alternative (Manual Download):**
1. Visit the URLs above in your browser
2. Save the files to the `lib/` directory
3. Make sure filenames match exactly

## Step 2: Load Extension in Chrome (1 minute)

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `CompanyLens` directory
6. Verify extension appears in your toolbar

**Important**: After adding the libraries, reload the extension:
- Click the **reload button** (🔄) next to the Company Lens extension
- Or disable and re-enable the extension

## Step 3: Get DeepSeek API Key (1 minute)

1. Visit [https://platform.deepseek.com](https://platform.deepseek.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

💡 **Tip**: DeepSeek offers free credits for new users!

## Step 4: Configure Extension (1 minute)

1. Click the **Company Lens icon** in your Chrome toolbar
2. Click **"📄 Upload CV (PDF/DOCX)"**
3. Select your CV file (PDF or DOCX)
4. Wait for "CV uploaded successfully!" message
5. Paste your DeepSeek API key in the "DeepSeek API Key" field
6. Click **"Save"**

✅ You're all set!

## Step 5: Try It Out! (30 seconds)

### Compare Your CV with a Job

1. Go to [StepStone](https://www.stepstone.de) or [Indeed](https://www.indeed.com)
2. Open any job detail page
3. Click the **Company Lens icon** in your toolbar
4. Click **"Compare with Job"** button
5. Wait 10-20 seconds for AI analysis
6. View results in the side panel!

### View Company Ratings

1. On any job page, look for the **Kununu badge** (appears automatically)
2. Click the badge to preview the company's Kununu profile
3. Browse ratings and reviews

## What's Next?

### Understanding Your Results

**Match Score**
- 70-100%: Excellent match! 🎯
- 50-69%: Good match with some gaps
- Below 50%: Significant skill gaps

**Summary View**
- See top matching skills (green)
- Identify missing skills (orange)
- Get quick recommendations

**Detailed View**
- Deep analysis of strengths
- Comprehensive gap assessment
- Experience and education review
- Actionable recommendations

### Managing Your Data

**Update Your CV**
- Upload a new file to replace the current one
- Extension keeps only the latest version

**Change API Key**
- Update anytime in the popup
- Useful if you rotate keys or switch accounts

**Delete Data**
- Click "Delete CV" to remove your CV
- Extension stores everything locally (no cloud)

## Troubleshooting

### "PDF.js library not loaded"

**Solution**: Download the libraries (Step 1)
```bash
cd lib/
curl -o pdf.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js
curl -o pdf.worker.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js
```

### "Could not extract job description"

**Solutions**:
- Make sure you're on a **job detail page** (not search results)
- Try refreshing the page
- Check console for errors (F12 → Console)

### "Invalid API key"

**Solutions**:
- Verify key starts with `sk-`
- Check key is active on DeepSeek platform
- Try generating a new key

### "Compare with Job" button is disabled

**Check these**:
- ✅ CV uploaded?
- ✅ API key saved?
- ✅ On a job page (StepStone or Indeed)?

All three must be true to enable comparison.

## Tips for Best Results

### CV Tips

✅ **Do:**
- Use a clear, text-based PDF or DOCX
- Keep file under 10MB
- Include all relevant skills
- Format consistently

❌ **Don't:**
- Use scanned/image PDFs
- Include large images
- Use unusual formatting

### API Usage

- Each comparison uses ~2000-4000 tokens
- DeepSeek charges per token (very affordable)
- Free tier usually includes 5M tokens
- Monitor your usage on DeepSeek dashboard

### Privacy

- All data stored locally in your browser
- API calls go directly to DeepSeek (not through us)
- No tracking or analytics
- Open source - inspect the code!

## Advanced Features

### Diagnostics Mode

For testing Kununu widget:
1. Open extension popup
2. Enable "Diagnostics: Kununu Widget Spike"
3. Enter test slug (e.g., `de/sap`)
4. View iframe embedding test

### Company Slug Mapping

The extension auto-detects companies and suggests Kununu URLs:
1. Click Kununu badge
2. In the preview overlay, click "✏ Edit"
3. Adjust the company slug if needed
4. Click "Save" to remember for next time

## Getting Help

### Common Issues

1. **Extension not appearing**: Reload `chrome://extensions/`
2. **Badge not showing**: Refresh the job page
3. **Comparison takes too long**: Check internet connection
4. **Side panel won't open**: Requires Chrome 114+

### Check Logs

Open DevTools Console (F12) and look for:
- `[Company Lens]` messages
- Any error messages in red

### Report Issues

Found a bug? Check:
1. Console logs (F12 → Console)
2. Extension version (`chrome://extensions/`)
3. Chrome version (`chrome://version/`)

## Resources

- **Full Documentation**: See `README.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Library Setup**: See `lib/README.md`
- **Testing Guide**: See `TESTING.md`

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│         COMPANY LENS QUICK COMMANDS         │
├─────────────────────────────────────────────┤
│ Upload CV:       Click extension → Upload   │
│ Set API Key:     Click extension → Enter    │
│ Compare:         On job page → Compare      │
│ View Results:    Auto-opens in side panel   │
│ Company Rating:  Click Kununu badge         │
│ Delete CV:       Click extension → Delete   │
├─────────────────────────────────────────────┤
│ Supported Sites: StepStone, Indeed          │
│ Supported Files: PDF, DOCX                  │
│ Required:        Chrome 114+, DeepSeek API  │
└─────────────────────────────────────────────┘
```

---

**🎉 Happy Job Hunting!**

Company Lens helps you apply smarter, not harder. Good luck with your applications!
