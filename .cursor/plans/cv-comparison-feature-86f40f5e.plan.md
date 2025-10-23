<!-- 86f40f5e-db6b-4ad7-9327-799b3aedeeff 05e27801-2e61-483f-bb4e-adf21b3c150e -->
# Company Lens CV Comparison Feature

## Overview

Add CV comparison functionality to the extension, allowing users to upload their CV (PDF/DOCX), extract job descriptions from StepStone and Indeed, and compare them using DeepSeek API with results in a side panel.

## Implementation Steps

### 1. Rename Extension to "Company Lens"

- Update `manifest.json`: name, description, title
- Update all HTML files: titles, headers, text
- Update all JavaScript files: comments, console logs
- Update documentation files: README.md, ARCHITECTURE.md, etc.
- Keep existing Kununu badge functionality intact

### 2. Add PDF/DOCX Parsing Libraries

- Add `pdf.js` library for PDF parsing (Mozilla's PDF.js)
- Add `mammoth.js` library for DOCX parsing
- These will be bundled as library files in the extension
- Create a `lib/` directory for third-party libraries

### 3. Enhance Popup UI

**Add to `popup/popup.html` and `popup/popup.js`:**

- CV upload section with file input (accept PDF and DOCX)
- Display uploaded CV status (filename, size, upload date)
- Delete CV button
- DeepSeek API key input field (password type) with save button
- API key status indicator (set/not set, masking key)
- "Compare with Job" button (enabled only when CV + API key present and on job page)
- Visual separation between Kununu and CV comparison features

### 4. Create CV Storage System

**New module: `utils/cv-storage.js`**

- Store CV as base64-encoded string in `chrome.storage.local`
- Store CV metadata (filename, size, upload date, file type)
- Implement size limit check (Chrome storage is ~5MB for local)
- Functions: `storeCV()`, `getCV()`, `deleteCV()`, `getCVMetadata()`
- Store DeepSeek API key securely in `chrome.storage.local`
- Functions: `storeAPIKey()`, `getAPIKey()`, `deleteAPIKey()`

### 5. Create File Parser Module

**New module: `utils/file-parser.js`**

- Parse PDF files using pdf.js to extract text
- Parse DOCX files using mammoth.js to extract text
- Return plain text representation of CV
- Handle parsing errors gracefully
- Functions: `parsePDF(fileBlob)`, `parseDOCX(fileBlob)`, `parseCV(file)`

### 6. Enhance Job Description Extraction

**Update `content/content.js`:**

- Add function `extractJobDescription()` for StepStone
                - Target selectors for job description section
                - Extract full job text including requirements, responsibilities
- Add function `extractJobDescription()` for Indeed
                - Target Indeed's job description selectors
                - Handle Indeed's dynamic content loading
- Return structured data: { title, company, description, requirements, benefits }
- Handle missing or incomplete job data

### 7. Create Side Panel

**New files: `sidepanel/sidepanel.html`, `sidepanel/sidepanel.js`, `sidepanel/sidepanel.css`**

- Register side panel in `manifest.json` (Chrome 114+)
- Display comparison results with two views:
                - **Summary View**: Match score (0-100%), key matching skills, top gaps
                - **Detailed View**: Section-by-section analysis, matched requirements, missing skills, recommendations
- Loading state while API processes
- Error handling display
- "Close" button
- Responsive design

### 8. DeepSeek API Integration

**New module: `utils/deepseek-api.js`**

- Function `compareWithDeepSeek(cvText, jobDescription, apiKey)`
- Make API call to DeepSeek with structured prompt
- Prompt structure:
  ```
  You are a career advisor. Compare this CV with the job description.
  
  CV: [cvText]
  
  Job Description: [jobDescription]
  
  Provide:
  1. Match score (0-100%)
  2. Key matching skills (list)
  3. Missing/gap skills (list)
  4. Detailed section analysis
  5. Recommendations
  
  Format as JSON.
  ```

- Parse API response into structured format
- Handle API errors (invalid key, rate limits, network issues)
- Return formatted comparison object

### 9. Background Script for API Calls

**New file: `background.js`**

- Register as service worker in `manifest.json`
- Handle messages from content script to make API calls
- Bypass CORS issues by making requests from background
- Message types: `COMPARE_CV`, `CHECK_API_KEY`
- Send results back to content script
- Handle errors and timeouts

### 10. Comparison Orchestration

**Update `content/content.js`:**

- Listen for comparison trigger from popup
- Extract job description from current page
- Send message to background script with CV text and job data
- Receive comparison results
- Open side panel with results
- Show loading indicator during processing
- Handle errors with user-friendly messages

### 11. Update Manifest and Permissions

**Update `manifest.json`:**

- Add `storage` permission (already present)
- Add `sidePanel` permission
- Register side panel
- Register background service worker
- Add host permissions for DeepSeek API: `https://api.deepseek.com/*`
- Update version to 2.0.0

### 12. UI/UX Enhancements

- Add loading spinners for async operations
- Toast notifications for success/error states
- Disable Compare button when not on job detail page
- Show helpful messages when CV or API key not set
- Smooth transitions and animations
- Consistent color scheme and branding

## Key Files to Create/Modify

### New Files

- `lib/pdf.min.js` - PDF.js library
- `lib/mammoth.browser.min.js` - Mammoth library
- `utils/cv-storage.js` - CV and API key storage
- `utils/file-parser.js` - PDF/DOCX parsing
- `utils/deepseek-api.js` - DeepSeek integration
- `background.js` - Service worker for API calls
- `sidepanel/sidepanel.html` - Side panel UI
- `sidepanel/sidepanel.js` - Side panel logic
- `sidepanel/sidepanel.css` - Side panel styles

### Modified Files

- `manifest.json` - Update name, add permissions, register side panel and background
- `popup/popup.html` - Add CV upload, API key, and Compare button
- `popup/popup.js` - Handle CV upload, API key, comparison trigger
- `content/content.js` - Add job extraction, comparison orchestration
- `README.md` - Update documentation
- All files with "Kununu Badge" references

## Technical Considerations

### Storage Limits

- Chrome local storage: ~5MB (sufficient for typical CVs)
- If CV too large, show error and suggest compression

### API Security

- Store API key securely in local storage
- Never expose key in console logs
- Use HTTPS for all API calls
- Validate API key format before storage

### DeepSeek API

- Endpoint: `https://api.deepseek.com/v1/chat/completions`
- Model: `deepseek-chat` (or user preference)
- Rate limits: Handle 429 responses gracefully
- Cost: Inform user that API usage may incur costs

### Browser Compatibility

- Chrome 114+ required for side panel API
- Fallback: Show results in modal overlay if side panel unavailable

### Performance

- Parse CV only once on upload, cache text
- Debounce comparison requests
- Show loading states for all async operations
- Limit API response size to avoid memory issues

### To-dos

- [ ] Rename extension from 'Kununu Badge' to 'Company Lens' across all files
- [ ] Add PDF.js and Mammoth.js libraries to lib/ directory
- [ ] Create CV and API key storage module (utils/cv-storage.js)
- [ ] Create file parser module for PDF/DOCX (utils/file-parser.js)
- [ ] Update popup UI with CV upload, API key input, and Compare button
- [ ] Add job description extraction for StepStone and Indeed in content script
- [ ] Create background service worker for API calls (background.js)
- [ ] Create DeepSeek API integration module (utils/deepseek-api.js)
- [ ] Create side panel for displaying comparison results
- [ ] Implement comparison orchestration in content script
- [ ] Update manifest.json with new permissions and components
- [ ] Update README and other documentation files