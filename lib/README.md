# Required Libraries for Company Lens

This directory should contain the following JavaScript libraries for CV parsing:

## PDF.js (Mozilla's PDF Parser)

**Required file:** `pdf.min.js` and `pdf.worker.min.js`

**Download from:**
- https://mozilla.github.io/pdf.js/getting_started/#download
- Or CDN: https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/

**Files needed:**
1. `pdf.min.js` - Main PDF.js library
2. `pdf.worker.min.js` - Worker script for PDF parsing

**Installation:**
```bash
# Download latest version
curl -o lib/pdf.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js
curl -o lib/pdf.worker.min.js https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js
```

## Mammoth.js (DOCX Parser)

**Required file:** `mammoth.browser.min.js`

**Download from:**
- https://github.com/mwilliamson/mammoth.js
- Or CDN: https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js

**Installation:**
```bash
# Download latest version
curl -o lib/mammoth.browser.min.js https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js
```

## Alternative: Use CDN Links

If you prefer not to download the files, you can reference them from CDN in your HTML files.

However, for Chrome extensions, **local files are recommended** for:
- Offline functionality
- Faster loading
- Better security
- No external dependencies

## Setup Instructions

1. Download both libraries using the commands above or manually from their websites
2. Place them in this `lib/` directory
3. The extension will automatically load them when parsing CV files

## Verify Installation

After downloading, your `lib/` directory should contain:
```
lib/
├── README.md (this file)
├── pdf.min.js
├── pdf.worker.min.js
└── mammoth.browser.min.js
```

## License Information

- **PDF.js**: Apache License 2.0
- **Mammoth.js**: BSD 2-Clause License

Both libraries are open source and free to use.

