/**
 * Popup script for Company Lens extension
 * Handles CV upload, API key management, and comparison triggering
 */

(function() {
  'use strict';

  // DOM Elements - Existing
  const toggle = document.getElementById('badgeToggle');
  const status = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const diagnosticsToggle = document.getElementById('diagToggle');
  const testSlugInput = document.getElementById('diagSlugInput');
  const diagnosticsInfo = document.getElementById('diagnosticsInfo');

  // DOM Elements - New CV Comparison
  const cvFileInput = document.getElementById('cvFileInput');
  const cvUploadButton = document.getElementById('cvUploadButton');
  const cvStatus = document.getElementById('cvStatus');
  const cvFilename = document.getElementById('cvFilename');
  const cvMeta = document.getElementById('cvMeta');
  const cvDeleteButton = document.getElementById('cvDeleteButton');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiKeySaveButton = document.getElementById('apiKeySaveButton');
  const apiKeyStatus = document.getElementById('apiKeyStatus');
  const compareButton = document.getElementById('compareButton');
  const compareHelp = document.getElementById('compareHelp');

  /**
   * Shows a temporary status message
   */
  function showStatus(message, duration = 2000) {
    statusText.textContent = message;
    status.classList.add('show');
    
    setTimeout(() => {
      status.classList.remove('show');
    }, duration);
  }

  /**
   * Loads diagnostics settings from chrome.storage.local
   */
  async function loadDiagnosticsSettings() {
    // Set defaults first
    diagnosticsToggle.checked = false;
    testSlugInput.value = 'de/sap';
    diagnosticsInfo.style.display = 'none';

    if (!chrome?.storage?.local) {
      console.warn('[Company Lens] chrome.storage.local not available');
      return;
    }

    try {
      const result = await chrome.storage.local.get({
        kununuDiagEnabled: false,
        kununuDiagTestSlug: 'de/sap'
      });
      
      diagnosticsToggle.checked = result.kununuDiagEnabled;
      testSlugInput.value = result.kununuDiagTestSlug;
      diagnosticsInfo.style.display = result.kununuDiagEnabled ? 'block' : 'none';
    } catch (error) {
      console.warn('[Company Lens] Error loading diagnostics settings:', error);
    }
  }

  /**
   * Saves diagnostics settings to chrome.storage.local
   */
  async function saveDiagnosticsSettings() {
    if (!chrome?.storage?.local) {
      showStatus('Storage API not available', 2000);
      return;
    }

    try {
      await chrome.storage.local.set({
        kununuDiagEnabled: diagnosticsToggle.checked,
        kununuDiagTestSlug: testSlugInput.value.trim() || 'de/sap'
      });
      showStatus('Diagnostics settings saved', 1500);
    } catch (error) {
      console.warn('[Company Lens] Error saving diagnostics settings:', error);
      showStatus('Error saving settings', 2000);
    }
  }

  /**
   * Load CV status
   */
  async function loadCVStatus() {
    if (!chrome?.storage?.local) {
      return;
    }

    if (typeof getCVMetadata === 'undefined') {
      console.warn('[Company Lens] getCVMetadata not available');
      return;
    }

    try {
      const metadata = await getCVMetadata();
      
      if (metadata) {
        cvFilename.textContent = metadata.filename;
        const sizeKB = (metadata.size / 1024).toFixed(1);
        const date = new Date(metadata.uploadDate).toLocaleDateString();
        cvMeta.textContent = `${sizeKB} KB • Uploaded ${date}`;
        cvStatus.classList.add('show');
      } else {
        cvStatus.classList.remove('show');
      }
    } catch (error) {
      console.error('[Company Lens] Error loading CV status:', error);
    }
    
    updateCompareButtonState();
  }

  /**
   * Load API key status
   */
  async function loadAPIKeyStatus() {
    if (!chrome?.storage?.local) {
      return;
    }

    if (typeof getAPIKey === 'undefined') {
      console.warn('[Company Lens] getAPIKey not available');
      return;
    }

    try {
      const apiKey = await getAPIKey();
      
      if (apiKey && apiKey.length > 0) {
        const masked = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
        apiKeyStatus.textContent = `✓ API key set: ${masked}`;
        apiKeyStatus.className = 'api-key-status api-key-status--set';
        apiKeyInput.value = '';
        apiKeyInput.placeholder = 'API key is set';
      } else {
        apiKeyStatus.textContent = '⚠ No API key set';
        apiKeyStatus.className = 'api-key-status api-key-status--not-set';
        apiKeyInput.placeholder = 'sk-...';
      }
    } catch (error) {
      console.error('[Company Lens] Error loading API key status:', error);
    }
    
    updateCompareButtonState();
  }

  /**
   * Update compare button state based on CV, API key, and current tab
   */
  async function updateCompareButtonState() {
    if (!chrome?.storage?.local || !chrome?.tabs) {
      return;
    }

    if (typeof hasCV === 'undefined' || typeof hasAPIKey === 'undefined') {
      console.warn('[Company Lens] Storage helper functions not available');
      return;
    }

    try {
      // Check if CV and API key exist
      const cvExists = await hasCV();
      const apiKeyExists = await hasAPIKey();
      
      // Check if we're on a job page
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const isJobSite = tab && (
        tab.url.includes('stepstone.de') || 
        tab.url.includes('indeed.com') ||
        tab.url.includes('indeed.de')
      );
      
      // Enable button only if all conditions met
      const canCompare = cvExists && apiKeyExists && isJobSite;
      compareButton.disabled = !canCompare;
      
      // Update help text
      if (!cvExists && !apiKeyExists) {
        compareHelp.textContent = 'Upload CV and set API key to compare';
      } else if (!cvExists) {
        compareHelp.textContent = 'Upload CV to enable comparison';
      } else if (!apiKeyExists) {
        compareHelp.textContent = 'Set API key to enable comparison';
      } else if (!isJobSite) {
        compareHelp.textContent = 'Navigate to a job page to compare';
      } else {
        compareHelp.textContent = 'Ready to compare!';
      }
    } catch (error) {
      console.error('[Company Lens] Error updating compare button:', error);
    }
  }

  /**
   * Handle CV upload button click
   */
  function handleCVUploadClick() {
    cvFileInput.click();
  }

  /**
   * Handle CV file selection
   */
  async function handleCVFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
      showStatus('Please select a PDF or DOCX file', 3000);
      return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showStatus('File too large. Maximum size is 10MB', 3000);
      return;
    }
    
    showStatus('Parsing CV...', 0);
    cvUploadButton.disabled = true;
    
    try {
      // Parse the file
      const result = await parseFile(file);
      
      if (!result.success) {
        showStatus(result.error || 'Failed to parse CV', 3000);
        cvUploadButton.disabled = false;
        return;
      }
      
      // Store CV
      const storeResult = await storeCVData(result.text, {
        filename: file.name,
        size: file.size,
        fileType: file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx'
      });
      
      if (storeResult.success) {
        showStatus('CV uploaded successfully!', 2000);
        await loadCVStatus();
      } else {
        showStatus(storeResult.error || 'Failed to store CV', 3000);
      }
    } catch (error) {
      console.error('[Company Lens] Error uploading CV:', error);
      showStatus('Error uploading CV', 3000);
    } finally {
      cvUploadButton.disabled = false;
      cvFileInput.value = ''; // Reset file input
    }
  }

  /**
   * Parse file (PDF or DOCX)
   */
  async function parseFile(file) {
    // Check if parser function is available
    if (typeof parseCV === 'undefined') {
      return { 
        success: false, 
        error: 'Parser not loaded. Please reload the extension.' 
      };
    }
    
    // Check if libraries are loaded
    if (file.name.toLowerCase().endsWith('.pdf') && typeof pdfjsLib === 'undefined') {
      return {
        success: false,
        error: 'PDF.js library not loaded. Please reload the extension.'
      };
    }
    
    if (file.name.toLowerCase().endsWith('.docx') && typeof mammoth === 'undefined') {
      return {
        success: false,
        error: 'Mammoth.js library not loaded. Please reload the extension.'
      };
    }
    
    return await parseCV(file);
  }

  /**
   * Store CV data in chrome.storage
   */
  async function storeCVData(text, metadata) {
    if (!chrome?.storage?.local) {
      return { success: false, error: 'Storage API not available' };
    }
    
    if (typeof storeCV === 'undefined') {
      return { 
        success: false, 
        error: 'Storage module not loaded. Please reload the extension.' 
      };
    }
    
    try {
      return await storeCV(text, metadata);
    } catch (error) {
      console.error('[Company Lens] Error storing CV:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle CV delete
   */
  async function handleCVDelete() {
    if (!confirm('Are you sure you want to delete your CV?')) {
      return;
    }
    
    try {
      if (typeof deleteCV === 'undefined') {
        showStatus('Storage module not loaded. Please reload extension.', 3000);
        return;
      }
      
      await deleteCV();
      cvStatus.classList.remove('show');
      showStatus('CV deleted', 2000);
      await updateCompareButtonState();
    } catch (error) {
      console.error('[Company Lens] Error deleting CV:', error);
      showStatus('Error deleting CV', 2000);
    }
  }

  /**
   * Handle API key save
   */
  async function handleAPIKeySave() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showStatus('Please enter an API key', 2000);
      return;
    }
    
    if (!apiKey.startsWith('sk-')) {
      showStatus('Invalid API key format. Should start with "sk-"', 3000);
      return;
    }
    
    try {
      if (typeof storeAPIKey === 'undefined') {
        showStatus('Storage module not loaded. Please reload extension.', 3000);
        return;
      }
      
      const result = await storeAPIKey(apiKey);
      
      if (result.success) {
        showStatus('API key saved!', 2000);
        await loadAPIKeyStatus();
      } else {
        showStatus(result.error || 'Failed to save API key', 3000);
      }
    } catch (error) {
      console.error('[Company Lens] Error saving API key:', error);
      showStatus('Error saving API key', 2000);
    }
  }

  /**
   * Handle compare button click
   */
  async function handleCompare() {
    compareButton.disabled = true;
    showStatus('Starting comparison...', 0);
    
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        showStatus('Could not get current tab', 3000);
        compareButton.disabled = false;
        return;
      }
      
      // Send message to content script to start comparison
      chrome.tabs.sendMessage(tab.id, { type: 'START_COMPARISON' }, response => {
        if (chrome.runtime.lastError) {
          console.error('[Company Lens] Error sending message:', chrome.runtime.lastError);
          showStatus('Error: Please refresh the page and try again', 3000);
          compareButton.disabled = false;
          return;
        }
        
        if (response && response.success) {
          showStatus('Opening comparison...', 2000);
          // Close popup after a short delay
          setTimeout(() => window.close(), 1000);
        } else {
          showStatus(response?.error || 'Failed to start comparison', 3000);
          compareButton.disabled = false;
        }
      });
    } catch (error) {
      console.error('[Company Lens] Error handling compare:', error);
      showStatus('Error starting comparison', 3000);
      compareButton.disabled = false;
    }
  }

  /**
   * Initializes the popup
   */
  async function init() {
    try {
      // Load diagnostics settings
      await loadDiagnosticsSettings();
      
      // Load CV status
      await loadCVStatus();
      
      // Load API key status
      await loadAPIKeyStatus();
      
      // Set badge toggle to enabled by default
      toggle.checked = true;
      
      showStatus('Settings loaded', 1000);
    } catch (error) {
      console.warn('[Company Lens] Error initializing popup:', error);
      showStatus('Error loading settings', 2000);
    }
  }

  /**
   * Handles badge toggle change
   */
  function handleToggleChange() {
    const enabled = toggle.checked;
      showStatus(enabled ? 'Badge enabled' : 'Badge disabled', 1500);
  }

  /**
   * Handles diagnostics toggle change
   */
  function handleDiagnosticsToggleChange() {
    diagnosticsInfo.style.display = diagnosticsToggle.checked ? 'block' : 'none';
    saveDiagnosticsSettings();
  }

  /**
   * Handles test slug input change (with debounce)
   */
  let slugDebounceTimer = null;
  function handleTestSlugChange() {
    if (slugDebounceTimer) {
      clearTimeout(slugDebounceTimer);
    }
    slugDebounceTimer = setTimeout(() => {
      saveDiagnosticsSettings();
    }, 500);
  }

  // Event listeners - Existing
  toggle.addEventListener('change', handleToggleChange);
  diagnosticsToggle.addEventListener('change', handleDiagnosticsToggleChange);
  testSlugInput.addEventListener('input', handleTestSlugChange);

  // Event listeners - New CV Comparison
  cvUploadButton.addEventListener('click', handleCVUploadClick);
  cvFileInput.addEventListener('change', handleCVFileSelect);
  cvDeleteButton.addEventListener('click', handleCVDelete);
  apiKeySaveButton.addEventListener('click', handleAPIKeySave);
  compareButton.addEventListener('click', handleCompare);

  // Initialize on popup open
  init();

})();

