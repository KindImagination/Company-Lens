/**
 * Popup script for Kununu Badge extension
 * Handles toggle state communication with content script
 */

(function() {
  'use strict';

  const toggle = document.getElementById('badgeToggle');
  const status = document.getElementById('status');
  const statusText = document.getElementById('statusText');

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
   * Gets the current active tab
   */
  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  /**
   * Checks if the current tab is a StepStone page
   */
  function isStepStonePage(url) {
    return url && url.includes('stepstone.de');
  }

  /**
   * Initializes the popup by loading current badge state
   */
  async function init() {
    try {
      const tab = await getCurrentTab();
      
      if (!isStepStonePage(tab.url)) {
        // Not on a StepStone page
        toggle.disabled = true;
        toggle.checked = false;
        showStatus('Not on a StepStone page', 3000);
        return;
      }

      // Get current state from content script
      chrome.tabs.sendMessage(tab.id, { type: 'getBadgeState' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Could not communicate with content script:', chrome.runtime.lastError);
          // Default to enabled
          toggle.checked = true;
          return;
        }
        
        if (response && typeof response.enabled === 'boolean') {
          toggle.checked = response.enabled;
        }
      });
    } catch (error) {
      console.error('Error initializing popup:', error);
    }
  }

  /**
   * Handles toggle change event
   */
  async function handleToggleChange() {
    const enabled = toggle.checked;
    
    try {
      const tab = await getCurrentTab();
      
      if (!isStepStonePage(tab.url)) {
        showStatus('Only works on StepStone pages', 3000);
        return;
      }

      // Send message to content script
      chrome.tabs.sendMessage(
        tab.id, 
        { 
          type: 'toggleBadge', 
          enabled: enabled 
        }, 
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            showStatus('Error: Please refresh the page', 3000);
            return;
          }
          
          if (response && response.success) {
            showStatus(enabled ? 'Badge enabled' : 'Badge disabled', 1500);
          }
        }
      );
    } catch (error) {
      console.error('Error handling toggle:', error);
      showStatus('Error occurred', 2000);
    }
  }

  // Event listeners
  toggle.addEventListener('change', handleToggleChange);

  // Initialize on popup open
  init();

})();

