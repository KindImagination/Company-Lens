# Company Lens

A powerful Chrome extension that helps you analyze job postings on StepStone and Indeed by comparing them with your CV using AI, plus displays Kununu company ratings.

## 🌟 Features

### CV Comparison (New!)
- **Upload Your CV**: Support for PDF and DOCX formats
- **AI-Powered Analysis**: Uses DeepSeek AI to compare your CV against job descriptions
- **Match Scoring**: Get a percentage match score (0-100%)
- **Skills Analysis**: See which skills match and which are missing
- **Detailed Insights**: Comprehensive analysis of strengths, gaps, experience, and education
- **Actionable Recommendations**: Get specific advice to improve your application

### Kununu Integration
- **Company Ratings**: Display Kununu rating badges on job listings
- **Smart Positioning**: Badge appears near company name or floats in corner
- **Preview Overlay**: Click badge to preview Kununu profile in iframe
- **Auto-Detection**: Automatically identifies companies and suggests Kununu URLs
- **SPA-Resilient**: Works seamlessly with single-page applications

### Supported Job Sites
- StepStone (stepstone.de)
- Indeed (all regions: .com, .de, .co.uk, etc.)

## 🚀 Installation

### Prerequisites

1. **Chrome Browser** (version 114 or later for side panel support)
2. **DeepSeek API Key** (get one at [https://platform.deepseek.com](https://platform.deepseek.com))
3. **PDF/DOCX Parsing Libraries** (see setup below)

### Setup Steps

1. **Download Required Libraries**
   
   The extension needs two libraries for CV parsing. Download them:
   
   ```bash
   # PDF.js for PDF parsing
   curl -o lib/pdf.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js
   curl -o lib/pdf.worker.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js
   
   # Mammoth.js for DOCX parsing
   curl -o lib/mammoth.browser.min.js https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js
   ```
   
   See `lib/README.md` for more details.

2. **Load Extension in Chrome**
   
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `CompanyLens` directory
   - Verify the extension appears and is enabled

3. **Configure the Extension**
   
   - Click the Company Lens icon in your toolbar
   - Upload your CV (PDF or DOCX format)
   - Enter your DeepSeek API key
   - Click "Save" to store your API key

## 📖 How to Use

### Comparing Your CV with a Job

1. **Navigate to a Job Listing**
   - Go to StepStone or Indeed
   - Open any job detail page

2. **Start Comparison**
   - Click the Company Lens extension icon
   - Click "Compare with Job" button
   - Wait 10-20 seconds for AI analysis

3. **View Results**
   - Results open automatically in the side panel
   - See your match score, matching skills, and gaps
   - Switch between Summary and Detailed views
   - Read recommendations for improving your application

### Viewing Company Ratings

1. **Badge Display**
   - Kununu badge appears automatically on job pages
   - Shows "K Kununu: —" placeholder

2. **Preview Company Profile**
   - Click the badge to open Kununu preview overlay
   - Browse company reviews and ratings
   - Edit/save company slug mappings if needed

### Managing Your Data

**CV Management:**
- Upload a new CV to replace the existing one
- Delete your CV anytime using the "Delete CV" button
- CV is stored locally in browser storage (not sent anywhere except during comparison)

**API Key Management:**
- Update your API key anytime
- API key is stored securely in local storage
- Never shared or logged

## 🔧 Technical Details

### Architecture

```
Company Lens/
├── manifest.json              # Extension configuration (MV3)
├── background.js              # Service worker for API calls
├── content/
│   ├── content.js             # Main content script (badge + job extraction)
│   └── diagnostics.js         # Diagnostics overlay
├── popup/
│   ├── popup.html             # Extension popup UI
│   └── popup.js               # Popup logic (CV upload, API key, comparison)
├── sidepanel/
│   ├── sidepanel.html         # Comparison results UI
│   ├── sidepanel.css          # Styling
│   └── sidepanel.js           # Results display logic
├── utils/
│   ├── cv-storage.js          # CV and API key storage
│   └── file-parser.js         # PDF/DOCX parsing
├── lib/
│   ├── pdf.min.js             # PDF.js library
│   ├── pdf.worker.min.js      # PDF.js worker
│   └── mammoth.browser.min.js # Mammoth.js library
└── icons/                     # Extension icons
```

### Data Storage

- **CV Text**: Stored in `chrome.storage.local` (up to 4MB)
- **API Key**: Stored securely in `chrome.storage.local`
- **Comparison Results**: Cached in `chrome.storage.local`
- **Company Mappings**: Saved Kununu slug mappings

### Privacy & Security

✅ **Your data stays local**
- CV and API key stored only in your browser
- No data sent to Company Lens servers (we don't have any!)
- API calls go directly from your browser to DeepSeek

✅ **API Usage**
- Your API key is used only for comparisons you initiate
- Costs depend on your DeepSeek pricing plan
- Typical comparison: ~2000-4000 tokens

✅ **No Tracking**
- No analytics or telemetry
- No external network calls except to DeepSeek API during comparisons
- Open source - audit the code yourself

### Performance

- **CV Parsing**: 1-5 seconds depending on file size
- **AI Comparison**: 10-20 seconds via DeepSeek API
- **Badge Injection**: <3ms main thread impact
- **Storage Limits**: ~4MB for CV (sufficient for most CVs)

## 🎨 Customization

### Kununu Badge

Edit styles in `content/content.js` within the `createBadgeContent()` function:

```javascript
.kununu-badge {
  background: linear-gradient(135deg, #00b8d4 0%, #0097a7 100%);
  color: white;
  font-size: 13px;
  // ... modify as needed
}
```

### Side Panel Theme

Edit colors in `sidepanel/sidepanel.css`:

```css
.sidepanel__header {
  background: linear-gradient(135deg, #00b8d4 0%, #0097a7 100%);
  /* Change colors here */
}
```

## 🐛 Troubleshooting

### CV Upload Issues

**"PDF appears to be empty"**
- Your PDF may be image-based (scanned)
- Use a text-based PDF or OCR tool first

**"File too large"**
- Maximum size: 10MB for upload, 4MB for storage
- Compress your PDF or remove images

**"PDF.js library not loaded"**
- Download libraries from `lib/README.md`
- Reload extension after adding libraries

### Comparison Issues

**"Could not extract job description"**
- Make sure you're on a job detail page (not search results)
- Try refreshing the page
- Some job sites may have incompatible layouts

**"Invalid API key"**
- Verify your DeepSeek API key starts with "sk-"
- Check your API key is active on DeepSeek platform
- Try regenerating a new key

**"Rate limit exceeded"**
- DeepSeek has rate limits on API calls
- Wait a few minutes and try again
- Check your DeepSeek account quotas

### Side Panel Issues

**Side panel doesn't open**
- Requires Chrome 114+
- Check if side panel permission is granted
- Try clicking the extension icon to trigger comparison

### Badge Issues

**Badge not appearing**
- Verify you're on StepStone or Indeed
- Check extension is enabled
- Try refreshing the page
- Open DevTools console to check for errors

## 🔮 Future Enhancements

Potential features for future versions:

- [ ] Support for more file formats (RTF, TXT)
- [ ] Multiple CV profiles
- [ ] Job application tracking
- [ ] Cover letter generation
- [ ] Interview question suggestions
- [ ] Salary insights integration
- [ ] More job sites support
- [ ] Offline AI comparison (local models)
- [ ] Browser-wide comparison history

## 📝 Changelog

### Version 2.0.0 (Current)

**Major Features:**
- ✨ AI-powered CV comparison with DeepSeek
- 📄 CV upload support (PDF and DOCX)
- 🔑 DeepSeek API key management
- 📊 Match scoring and skills analysis
- 🎯 Detailed recommendations
- 🖼️ Side panel for results display
- 🏢 Job description extraction for StepStone and Indeed

**Improvements:**
- Renamed from "Kununu Badge" to "Company Lens"
- Enhanced UI with modern design
- Better error handling and user feedback
- Comprehensive documentation

### Version 1.0.0

**Initial Release:**
- Kununu badge display on StepStone and Indeed
- Shadow DOM isolation
- SPA navigation resilience
- Badge preview overlay
- Company slug auto-detection

## 🤝 Contributing

This is an open-source project. Contributions are welcome!

### Development Setup

1. Clone the repository
2. Install libraries (see `lib/README.md`)
3. Load extension in Chrome (developer mode)
4. Make changes and test
5. Submit pull request

### Code Style

- ES6+ JavaScript
- No external dependencies (except parsing libraries)
- Comprehensive error handling
- Console logging for debugging
- Comments for complex logic

## 📄 License

This project is open source and available for educational and personal use.

### Third-Party Libraries

- **PDF.js**: Apache License 2.0 (Mozilla)
- **Mammoth.js**: BSD 2-Clause License
- **DeepSeek API**: Commercial usage subject to DeepSeek terms

## 🔗 Resources

- [Chrome Extension Manifest V3 Docs](https://developer.chrome.com/docs/extensions/mv3/)
- [DeepSeek Platform](https://platform.deepseek.com)
- [StepStone](https://www.stepstone.de)
- [Indeed](https://www.indeed.com)
- [Kununu](https://www.kununu.com)

## ⚠️ Disclaimer

- This extension is not affiliated with StepStone, Indeed, Kununu, or DeepSeek
- Use responsibly and in accordance with each platform's terms of service
- API usage may incur costs on your DeepSeek account
- The extension is provided "as is" without warranty

---

**Built with ❤️ for job seekers**

**Version 2.0.0** • Last Updated: October 2025

Made by developers, for developers (and everyone else job hunting!)
