/**
 * Kununu Badge Content Script for StepStone
 * 
 * Injects a styled badge showing Kununu rating (placeholder) on StepStone pages.
 * Uses Shadow DOM for complete style isolation.
 * Implements MutationObserver for SPA navigation resilience.
 */

(function() {
  'use strict';

  // Configuration
  const BADGE_HOST_ID = 'kununu-badge-host';
  const STORAGE_KEY = 'kununuBadgeEnabled';
  const DEBOUNCE_MS = 300;
  
  // State
  let badgeInserted = false;
  let mutationObserver = null;
  let debounceTimer = null;
  let diagnosticsEnabled = false;
  let diagnosticsSlug = 'de/sap';

  /**
   * Check if badge is enabled for current tab
   * Default is enabled (true) if not explicitly disabled
   */
  function isBadgeEnabled() {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  }

  /**
   * Set badge enabled state
   */
  function setBadgeEnabled(enabled) {
    sessionStorage.setItem(STORAGE_KEY, String(enabled));
  }

  /**
   * Gets diagnostics configuration from chrome.storage.local
   * Returns a Promise that resolves with the config
   */
  function getDiagConfig() {
    return new Promise(resolve => {
      // Default config
      const defaults = {
        kununuDiagEnabled: false,
        kununuDiagTestSlug: 'de/sap'
      };

      // Check if chrome API is available
      if (typeof chrome === 'undefined') {
        console.warn('[Kununu Badge] chrome API not available, using defaults');
        resolve(defaults);
        return;
      }
      
      if (!chrome.storage) {
        console.warn('[Kununu Badge] chrome.storage not available, using defaults');
        resolve(defaults);
        return;
      }
      
      if (!chrome.storage.local) {
        console.warn('[Kununu Badge] chrome.storage.local not available, using defaults');
        resolve(defaults);
        return;
      }

      try {
        chrome.storage.local.get(defaults, resolve);
      } catch (error) {
        console.warn('[Kununu Badge] Error accessing chrome.storage.local:', error);
        resolve(defaults);
      }
    });
  }

  /**
   * Creates the badge HTML structure with inline styles
   * Completely isolated via Shadow DOM
   */
  function createBadgeContent() {
    return `
      <style>
        :host {
          all: initial;
          display: block;
        }
        
        .kununu-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #00b8d4 0%, #0097a7 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 13px;
          font-weight: 600;
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          cursor: default;
          user-select: none;
          white-space: nowrap;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .kununu-badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .kununu-badge__icon {
          width: 16px;
          height: 16px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        
        .kununu-badge__label {
          font-weight: 500;
          opacity: 0.95;
        }
        
        .kununu-badge__rating {
          font-weight: 700;
          font-size: 14px;
        }
        
        /* Floating variant */
        .kununu-badge--floating {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 999999;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>
      
      <div class="kununu-badge" role="status" aria-label="Kununu rating placeholder">
        <span class="kununu-badge__icon">K</span>
        <span class="kununu-badge__label">Kununu:</span>
        <span class="kununu-badge__rating">—</span>
      </div>
    `;
  }

  /**
   * Attempts to find a suitable anchor element near the company name
   * Returns an object with { element, mode } where mode is 'inline' or 'floating'
   */
  function findCompanyAnchor() {
    // Heuristic selectors for StepStone company information
    const selectors = [
      // Company name in job header
      '[data-at="header-company-name"]',
      'h1[class*="company"] + *',
      '[class*="company-name"]',
      '[class*="CompanyName"]',
      // Fallback to any heading containing "Unternehmen"
      'h2:has-text("Unternehmen")',
      'h3:has-text("Unternehmen")',
      // Generic job header areas
      'header [class*="job-header"]',
      '[class*="JobHeader"]',
      'article header'
    ];

    for (const selector of selectors) {
      try {
        // Skip pseudo-selectors like :has-text (not standard CSS)
        if (selector.includes(':has-text')) continue;
        
        const element = document.querySelector(selector);
        if (element && isElementVisible(element)) {
          return { element, mode: 'inline' };
        }
      } catch (e) {
        // Skip invalid selectors
        continue;
      }
    }

    // Fallback: look for any element with "Unternehmen" or "Company" text
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent && 
          (node.textContent.includes('Unternehmen') || node.textContent.includes('Company'))) {
        const parent = node.parentElement;
        if (parent && isElementVisible(parent) && 
            (parent.tagName === 'H1' || parent.tagName === 'H2' || parent.tagName === 'H3')) {
          return { element: parent.parentElement || parent, mode: 'inline' };
        }
      }
    }

    // No suitable anchor found - use floating mode
    return { element: document.body, mode: 'floating' };
  }

  /**
   * Check if element is visible in viewport
   */
  function isElementVisible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' &&
           style.opacity !== '0';
  }

  /**
   * Mounts the diagnostics overlay
   */
  function mountDiagnosticsOverlay(slug) {
    console.info('[Kununu-Widget-Spike] Diagnostics enabled, slug=', slug);
    
    // Remove badge if it exists
    removeBadge();
    
    // Show diagnostics if available and not already visible
    if (window.KununuDiagnostics && !window.KununuDiagnostics.isVisible()) {
      window.KununuDiagnostics.show(slug);
    }
  }

  /**
   * Unmounts the diagnostics overlay
   */
  function unmountDiagnosticsOverlay() {
    if (window.KununuDiagnostics && window.KununuDiagnostics.isVisible()) {
      window.KununuDiagnostics.hide();
    }
  }

  /**
   * Inserts the badge into the DOM
   * Ensures idempotency - only inserts once
   */
  function insertBadge() {
    // Check if already inserted
    if (badgeInserted || document.getElementById(BADGE_HOST_ID)) {
      return;
    }

    // Check if badge is enabled
    if (!isBadgeEnabled()) {
      console.log('[Kununu Badge] Badge is disabled for this tab');
      return;
    }

    // Find anchor point
    const { element, mode } = findCompanyAnchor();
    
    if (!element) {
      console.warn('[Kununu Badge] No suitable anchor element found');
      return;
    }

    // Create host element
    const hostElement = document.createElement('div');
    hostElement.id = BADGE_HOST_ID;
    hostElement.setAttribute('data-kununu-badge', 'true');
    
    // Attach closed Shadow DOM for complete isolation
    const shadowRoot = hostElement.attachShadow({ mode: 'closed' });
    shadowRoot.innerHTML = createBadgeContent();

    // Apply floating class if needed
    if (mode === 'floating') {
      const badge = shadowRoot.querySelector('.kununu-badge');
      if (badge) {
        badge.classList.add('kununu-badge--floating');
      }
    }

    // Insert into DOM
    if (mode === 'inline' && element !== document.body) {
      // Try to insert next to the company element
      element.appendChild(hostElement);
    } else {
      // Floating fallback
      document.body.appendChild(hostElement);
    }

    badgeInserted = true;
    console.log(`[Kununu Badge] Badge inserted in ${mode} mode`);
  }

  /**
   * Removes the badge from DOM
   */
  function removeBadge() {
    const existingHost = document.getElementById(BADGE_HOST_ID);
    if (existingHost) {
      existingHost.remove();
      badgeInserted = false;
      console.log('[Kununu Badge] Badge removed');
    }
  }

  /**
   * Debounced badge insertion for SPA navigation
   */
  function debouncedInsertBadge() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    debounceTimer = setTimeout(() => {
      // Remove old badge if exists (SPA navigation might change layout)
      const existingHost = document.getElementById(BADGE_HOST_ID);
      if (existingHost) {
        existingHost.remove();
        badgeInserted = false;
      }
      
      // Re-insert badge
      insertBadge();
    }, DEBOUNCE_MS);
  }

  /**
   * Sets up MutationObserver for SPA navigation resilience
   */
  function setupMutationObserver() {
    if (mutationObserver) {
      return; // Already set up
    }

    mutationObserver = new MutationObserver((mutations) => {
      // Check if significant DOM changes occurred
      const significantChange = mutations.some(mutation => {
        return mutation.addedNodes.length > 0 || 
               mutation.removedNodes.length > 0 ||
               (mutation.type === 'childList' && mutation.target.tagName === 'BODY');
      });

      if (significantChange) {
        debouncedInsertBadge();
      }
    });

    // Observe body for major changes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });

    console.log('[Kununu Badge] MutationObserver initialized');
  }

  /**
   * Storage change listener for live diagnostics toggle
   */
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      
      let shouldRefresh = false;
      let newDiagEnabled = diagnosticsEnabled;
      let newDiagSlug = diagnosticsSlug;
      
      if (changes.kununuDiagEnabled) {
        newDiagEnabled = changes.kununuDiagEnabled.newValue;
        shouldRefresh = true;
        console.log('[Kununu Badge] Diagnostics enabled changed to:', newDiagEnabled);
      }
      
      if (changes.kununuDiagTestSlug) {
        newDiagSlug = changes.kununuDiagTestSlug.newValue;
        shouldRefresh = true;
        console.log('[Kununu Badge] Diagnostics slug changed to:', newDiagSlug);
      }
      
      if (shouldRefresh) {
        // Update state
        diagnosticsEnabled = newDiagEnabled;
        diagnosticsSlug = newDiagSlug;
        
        // Switch modes based on new settings
        if (diagnosticsEnabled) {
          // Switch to diagnostics mode
          removeBadge();
          unmountDiagnosticsOverlay(); // Hide existing overlay first
          mountDiagnosticsOverlay(diagnosticsSlug); // Show with new settings
        } else {
          // Switch back to badge mode
          unmountDiagnosticsOverlay();
          insertBadge();
        }
      }
    });
  } else {
    console.warn('[Kununu Badge] chrome.storage.onChanged not available, live switching disabled');
  }

  /**
   * Initialize the extension
   */
  async function init() {
    console.log('[Kununu Badge] Initializing on', window.location.href);
    
    // Wait for diagnostics config before deciding what to render
    const diagConfig = await getDiagConfig();
    diagnosticsEnabled = diagConfig.kununuDiagEnabled;
    diagnosticsSlug = diagConfig.kununuDiagTestSlug;
    
    console.log('[Kununu Badge] Diagnostics config loaded:', { diagnosticsEnabled, diagnosticsSlug });
    
    // Route based on diagnostics flag
    if (diagnosticsEnabled) {
      // Do not render badge; mount diagnostics overlay
      mountDiagnosticsOverlay(diagnosticsSlug);
    } else {
      // Proceed with normal badge flow
      const doInsert = () => {
        insertBadge();
      };
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doInsert);
      } else {
        doInsert();
      }
    }

    // Setup observer for SPA navigation
    setupMutationObserver();
  }

  // Start the extension
  init();

})();

