/**
 * Popup script for Kununu Badge extension
 * Handles toggle state communication with content script
 */

(function() {
  'use strict';

  const toggle = document.getElementById('badgeToggle');
  const status = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const diagnosticsToggle = document.getElementById('diagToggle');
  const testSlugInput = document.getElementById('diagSlugInput');
  const diagnosticsInfo = document.getElementById('diagnosticsInfo');

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

    // Early return if Chrome APIs not available
    if (typeof chrome === 'undefined') {
      console.warn('chrome API not available, using defaults');
      return;
    }
    
    if (!chrome.storage) {
      console.warn('chrome.storage not available - extension may need to be reloaded, using defaults');
      return;
    }
    
    if (!chrome.storage.local) {
      console.warn('chrome.storage.local not available, using defaults');
      return;
    }

    try {
      const result = await chrome.storage.local.get({
        kununuDiagEnabled: false,
        kununuDiagTestSlug: 'de/sap'
      });
      
      diagnosticsToggle.checked = result.kununuDiagEnabled;
      testSlugInput.value = result.kununuDiagTestSlug;
      
      // Show/hide diagnostics info
      diagnosticsInfo.style.display = result.kununuDiagEnabled ? 'block' : 'none';
    } catch (error) {
      console.warn('Error loading diagnostics settings:', error);
    }
  }

  /**
   * Saves diagnostics settings to chrome.storage.local
   */
  async function saveDiagnosticsSettings() {
    // Early return if Chrome APIs not available
    if (typeof chrome === 'undefined') {
      console.warn('chrome API not available');
      showStatus('Extension APIs not loaded', 2000);
      return;
    }
    
    if (!chrome.storage) {
      console.warn('chrome.storage not available - extension may need to be reloaded');
      showStatus('Please reload extension', 2000);
      return;
    }
    
    if (!chrome.storage.local) {
      console.warn('chrome.storage.local not available');
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
      console.warn('Error saving diagnostics settings:', error);
      showStatus('Error saving settings', 2000);
    }
  }

  /**
   * Initializes the popup by loading settings
   */
  async function init() {
    try {
      // Load diagnostics settings
      await loadDiagnosticsSettings();
      
      // Set badge toggle to enabled by default (this is just UI state)
      toggle.checked = true;
      
      showStatus('Settings loaded', 1000);
    } catch (error) {
      console.warn('Error initializing popup:', error);
      showStatus('Error loading settings', 2000);
    }
  }

  /**
   * Handles toggle change event
   */
  async function handleToggleChange() {
    const enabled = toggle.checked;
    
    try {
      // Just show status - content script will handle via storage listener
      showStatus(enabled ? 'Badge enabled' : 'Badge disabled', 1500);
    } catch (error) {
      console.warn('Error handling toggle:', error);
      showStatus('Error occurred', 2000);
    }
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

  // Event listeners
  toggle.addEventListener('change', handleToggleChange);
  diagnosticsToggle.addEventListener('change', handleDiagnosticsToggleChange);
  testSlugInput.addEventListener('input', handleTestSlugChange);

  // Initialize on popup open
  init();

})();

