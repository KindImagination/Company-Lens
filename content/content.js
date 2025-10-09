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
   * Message listener for popup communication
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'toggleBadge') {
      const enabled = message.enabled;
      setBadgeEnabled(enabled);
      
      if (enabled) {
        insertBadge();
      } else {
        removeBadge();
      }
      
      sendResponse({ success: true, enabled });
    } else if (message.type === 'getBadgeState') {
      sendResponse({ enabled: isBadgeEnabled() });
    }
    
    return true; // Keep message channel open
  });

  /**
   * Initialize the extension
   */
  function init() {
    console.log('[Kununu Badge] Initializing on', window.location.href);
    
    // Initial badge insertion
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', insertBadge);
    } else {
      insertBadge();
    }

    // Setup observer for SPA navigation
    setupMutationObserver();
  }

  // Start the extension
  init();

})();

