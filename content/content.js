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
  const KUNUNU_BADGE_HOST_ID = 'kununu-badge-host';
  const KUNUNU_OVERLAY_ID = 'kununu-preview-overlay';
  const STORAGE_KEY = 'kununuBadgeEnabled';
  const DEBOUNCE_MS = 200; // Reduced to 200ms for better responsiveness
  
  // Module-level state guards
  const state = {
    isMutating: false,
    isMounted: false,
    lastCompanyNorm: null,
    currentSlug: null,
    observer: null,
    debounceTimer: null
  };
  
  // Legacy state (kept for compatibility)
  let badgeInserted = false;
  let mutationObserver = null;
  let debounceTimer = null;
  let diagnosticsEnabled = false;
  let diagnosticsSlug = 'de/sap';
  let badgeShadowRoot = null;
  
  // Auto-slug state
  let currentCompanyInfo = null; // { raw, normalized: { nameNorm, nameForSlug }, tokens }
  let currentSlug = null; // Auto-selected or saved slug
  let currentCandidates = [];

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
        console.warn('[Kununu] storage unavailable, using defaults');
        resolve(defaults);
        return;
      }
      
      if (!chrome.storage) {
        console.warn('[Kununu] storage unavailable, using defaults');
        resolve(defaults);
        return;
      }
      
      if (!chrome.storage.local) {
        console.warn('[Kununu] storage unavailable, using defaults');
        resolve(defaults);
        return;
      }

      try {
        chrome.storage.local.get(defaults, resolve);
      } catch (error) {
        console.warn('[Kununu] storage unavailable, using defaults');
        resolve(defaults);
      }
    });
  }

  /**
   * Loads the company slug mapping from chrome.storage.local
   * Returns a Promise that resolves with the mapping object
   */
  async function loadCompanySlugMap() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.warn('[Kununu] storage unavailable, using defaults');
      return {};
    }

    try {
      const result = await chrome.storage.local.get({ companySlugMap: {} });
      return result.companySlugMap || {};
    } catch (error) {
      console.warn('[Kununu] storage unavailable, using defaults');
      return {};
    }
  }

  /**
   * Saves a company slug mapping to chrome.storage.local
   * @param {string} nameNormalized - Normalized company name
   * @param {string} slug - Kununu slug
   * @param {boolean} confirmed - Whether user explicitly confirmed this slug
   */
  async function saveCompanySlug(nameNormalized, slug, confirmed = false) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.warn('[Kununu AutoSlug] Storage not available, cannot save mapping');
      return;
    }

    try {
      const map = await loadCompanySlugMap();
      map[nameNormalized] = {
        slug: slug,
        confirmed: confirmed,
        updatedAt: new Date().toISOString()
      };
      await chrome.storage.local.set({ companySlugMap: map });
      console.log('[Kununu AutoSlug] Saved mapping:', nameNormalized, '→', slug, 'confirmed:', confirmed);
    } catch (error) {
      console.warn('[Kununu AutoSlug] Error saving company slug mapping:', error);
    }
  }

  /**
   * Removes a company slug mapping from chrome.storage.local
   */
  async function removeCompanySlug(nameNormalized) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      console.warn('[Kununu] storage unavailable, using defaults');
      return;
    }

    try {
      const map = await loadCompanySlugMap();
      delete map[nameNormalized];
      await chrome.storage.local.set({ companySlugMap: map });
      console.log('[Kununu] Removed mapping for:', nameNormalized);
    } catch (error) {
      console.warn('[Kununu] storage unavailable, using defaults');
    }
  }

  /**
   * Extracts company name from a given anchor element
   * Returns { raw: string|null, tokens: {...} }
   */
  function extractCompanyFromAnchor(anchor) {
    if (!anchor) return { raw: null, tokens: {} };

    let raw = null;

    // Strategy 1: textContent of the anchor itself
    if (anchor.textContent) {
      const text = anchor.textContent.trim();
      if (text.length > 2 && text.length < 150) {
        raw = text;
      }
    }

    // Strategy 2: Check attributes
    if (!raw) {
      for (const attr of ['aria-label', 'title', 'alt']) {
        const value = anchor.getAttribute(attr);
        if (value && value.trim().length > 2) {
          raw = value.trim();
          break;
        }
      }
    }

    // Strategy 3: Look for specific selectors within the anchor or nearby
    if (!raw) {
      const selectors = [
        '[data-at="header-company-name"]',
        '[data-at="jobad-header-company-name"]',
        'a[href*="/company"]',
        '[class*="company"] a',
        '[class*="company"] span',
        '[class*="company"] strong'
      ];

      for (const selector of selectors) {
        try {
          const element = anchor.querySelector(selector) || 
                         anchor.closest('header')?.querySelector(selector) ||
                         anchor.parentElement?.querySelector(selector);
          
          if (element && element.textContent) {
            const text = element.textContent.trim();
            if (text.length > 2 && text.length < 150) {
              raw = text;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    }

    // Detect legal suffix tokens for candidate generation
    const tokens = {
      gmbh: false,
      ag: false,
      se: false,
      kg: false,
      kgaa: false
    };

    if (raw) {
      const lowerRaw = raw.toLowerCase();
      tokens.gmbh = /\bgmbh\b/i.test(lowerRaw);
      tokens.ag = /\bag\b/i.test(lowerRaw);
      tokens.se = /\bse\b/i.test(lowerRaw);
      tokens.kgaa = /\bkgaa\b/i.test(lowerRaw);
      tokens.kg = /\bkg\b/i.test(lowerRaw) && !tokens.kgaa; // KG but not KGaA
    }

    return { raw, tokens };
  }

  /**
   * Normalizes company name for matching and slug generation
   * Returns { nameNorm: string, nameForSlug: string }
   */
  function normalizeCompanyName(raw) {
    if (!raw) return { nameNorm: '', nameForSlug: '' };

    let normalized = raw.trim();

    // Lowercase
    normalized = normalized.toLowerCase();

    // Remove common legal suffixes at the end (with various punctuation)
    // Order matters: match longer patterns first
    const suffixes = [
      'gmbh & co\\. kgaa',
      'gmbh & co kgaa',
      'ag & co\\. kgaa',
      'ag & co kgaa',
      'gmbh & co\\. kg',
      'gmbh & co kg',
      'ag & co\\. kg',
      'ag & co kg',
      'kgaa',
      'gmbh',
      'ag',
      'se',
      'kg',
      'ohg',
      'ug',
      'e\\.v\\.',
      'ev',
      'mbh' // catches gmbh without g
    ];

    for (const suffix of suffixes) {
      const regex = new RegExp(`\\s*[,\\.]?\\s*\\(?\\s*${suffix}\\s*\\)?\\s*$`, 'gi');
      normalized = normalized.replace(regex, '');
    }

    // German transliteration
    normalized = normalized
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss');

    // Remove punctuation except spaces and hyphens
    normalized = normalized.replace(/[.,&()\\/'"]/g, ' ');

    // Collapse multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // For slug: replace spaces with hyphens, collapse multiple hyphens, trim
    const nameForSlug = normalized
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    return {
      nameNorm: normalized,
      nameForSlug: nameForSlug
    };
  }

  /**
   * Generates candidate Kununu slugs based on tokens
   * Returns array of slug strings (ordered by priority)
   */
  function generateSlugCandidates(nameForSlug, tokens) {
    if (!nameForSlug) return ['de/unknown'];

    const candidates = [];

    // Primary candidate (no suffix)
    candidates.push(`de/${nameForSlug}`);

    // Add variants with suffixes based on detected tokens
    if (tokens.kgaa) {
      candidates.push(`de/${nameForSlug}-kgaa`);
    }
    if (tokens.gmbh) {
      candidates.push(`de/${nameForSlug}-gmbh`);
    }
    if (tokens.ag) {
      candidates.push(`de/${nameForSlug}-ag`);
    }
    if (tokens.se) {
      candidates.push(`de/${nameForSlug}-se`);
    }
    if (tokens.kg && !tokens.kgaa) {
      candidates.push(`de/${nameForSlug}-kg`);
    }

    // De-duplicate and limit to 4
    const unique = [...new Set(candidates)];
    return unique.slice(0, 4);
  }

  /**
   * Computes company info and slug from an anchor element
   * Updates global state: currentCompanyInfo, currentSlug, currentCandidates
   * Returns true if successful, false otherwise
   */
  async function computeCompanyAndSlug(anchor) {
    if (!anchor) {
      console.warn('[Kununu AutoSlug] No anchor provided');
      currentCompanyInfo = null;
      currentSlug = null;
      currentCandidates = [];
      return false;
    }

    // Extract company from anchor
    const extraction = extractCompanyFromAnchor(anchor);
    
    if (!extraction.raw) {
      console.warn('[Kununu AutoSlug] No company name found at anchor');
      currentCompanyInfo = null;
      currentSlug = null;
      currentCandidates = [];
      return false;
    }

    // Normalize
    const normalized = normalizeCompanyName(extraction.raw);
    
    // Check if company has changed - if not, do nothing
    if (normalized.nameNorm === state.lastCompanyNorm) {
      return true; // Company unchanged, no recomputation needed
    }
    
    // Company has changed - update state and recompute
    state.lastCompanyNorm = normalized.nameNorm;
    
    // Store company info
    currentCompanyInfo = {
      raw: extraction.raw,
      normalized: normalized,
      tokens: extraction.tokens
    };

    // Generate candidates
    currentCandidates = generateSlugCandidates(normalized.nameForSlug, extraction.tokens);

    // Check for saved mapping
    const map = await loadCompanySlugMap();
    const saved = map[normalized.nameNorm];

    if (saved && saved.slug) {
      // Use saved slug
      currentSlug = saved.slug;
      state.currentSlug = currentSlug;
      console.log('[Kununu AutoSlug] Company:', extraction.raw);
      console.log('[Kununu AutoSlug] Normalized:', normalized.nameNorm, '→ slug:', normalized.nameForSlug);
      console.log('[Kununu AutoSlug] Selected slug:', currentSlug, '(source: map, confirmed:', saved.confirmed + ')');
    } else {
      // Use first candidate (auto)
      currentSlug = currentCandidates[0] || 'de/unknown';
      state.currentSlug = currentSlug;
      console.log('[Kununu AutoSlug] Company:', extraction.raw);
      console.log('[Kununu AutoSlug] Normalized:', normalized.nameNorm, '→ slug:', normalized.nameForSlug);
      console.log('[Kununu AutoSlug] Selected slug:', currentSlug, '(source: auto, candidates:', currentCandidates.join(', ') + ')');
    }

    return true;
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
          display: inline-block;
          vertical-align: middle;
          line-height: 1;
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
          cursor: pointer;
          user-select: none;
          white-space: nowrap;
          box-sizing: border-box;
          min-width: 120px; /* Stable width to prevent layout shift */
          transition: transform 120ms ease;
        }
        
        .kununu-badge:hover {
          transform: translateY(-1px) scale(1.01);
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
          flex-shrink: 0;
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
   * Opens the Kununu preview overlay with an iframe
   * @param {string} slug - Kununu company slug (e.g., 'de/sap')
   * @param {object} companyInfo - { raw, normalized: { nameNorm, nameForSlug } }
   * @param {string[]} candidates - Array of candidate slugs
   */
  function openKununuPreviewOverlay(slug, companyInfo = null, candidates = []) {
    console.info('[Kununu] Preview overlay opened with slug:', slug);
    
    // Prevent duplicate overlays
    if (document.getElementById(KUNUNU_OVERLAY_ID)) {
      return;
    }

    // Create overlay host element
    const overlayHost = document.createElement('div');
    overlayHost.id = KUNUNU_OVERLAY_ID;
    overlayHost.setAttribute('data-kununu-preview', 'true');

    // Attach Shadow DOM for style isolation
    const shadowRoot = overlayHost.attachShadow({ mode: 'closed' });

    // Create overlay content
    let currentSlug = slug;
    const kununuUrl = `https://www.kununu.com/${slug}`;
    
    // Company display name
    const companyDisplay = companyInfo?.raw || 'Unknown Company';
    const hasCompany = !!companyInfo?.raw;

    shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
          display: block;
        }

        .preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }

        .preview-overlay__backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          cursor: pointer;
        }

        .preview-overlay__panel {
          position: relative;
          width: 90%;
          max-width: 1200px;
          height: 85vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s ease;
        }

        .preview-overlay__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: linear-gradient(135deg, #00b8d4 0%, #0097a7 100%);
          color: white;
          flex-shrink: 0;
        }

        .preview-overlay__title {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .preview-overlay__actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .preview-overlay__link {
          color: white;
          text-decoration: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .preview-overlay__link:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .preview-overlay__close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 24px;
          font-weight: 300;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
          line-height: 1;
          padding: 0;
        }

        .preview-overlay__close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .preview-overlay__content {
          flex: 1;
          overflow: hidden;
          display: flex;
        }

        .preview-overlay__iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: white;
        }

        .slug-editor {
          background: #f5f9fa;
          border-bottom: 1px solid #e0e0e0;
          padding: 12px 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          flex-shrink: 0;
        }

        .slug-editor__info {
          font-size: 13px;
          color: #555;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .slug-editor__company {
          font-weight: 600;
          color: #1a1a1a;
        }

        .slug-editor__slug {
          font-family: 'Courier New', monospace;
          color: #0097a7;
          font-weight: 600;
        }

        .slug-editor__controls {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-top: 10px;
        }

        .slug-editor__options {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .slug-editor__radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #333;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .slug-editor__radio-label:hover {
          background: rgba(0, 184, 212, 0.1);
        }

        .slug-editor__radio {
          margin: 0;
          cursor: pointer;
        }

        .slug-editor__radio-text {
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        .slug-editor__input-group {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 6px;
        }

        .slug-editor__input {
          flex: 1;
          padding: 6px 10px;
          font-size: 13px;
          font-family: 'Courier New', monospace;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
        }

        .slug-editor__input:focus {
          outline: none;
          border-color: #00b8d4;
          box-shadow: 0 0 0 2px rgba(0, 184, 212, 0.2);
        }

        .slug-editor__actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .slug-editor__button {
          padding: 6px 14px;
          font-size: 13px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-weight: 500;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .slug-editor__button--save {
          background: #00b8d4;
          color: white;
        }

        .slug-editor__button--save:hover {
          background: #0097a7;
        }

        .slug-editor__button--reset {
          background: #f5f5f5;
          color: #666;
          border: 1px solid #ddd;
        }

        .slug-editor__button--reset:hover {
          background: #ebebeb;
        }

        .slug-editor__button--reload {
          background: #ffa726;
          color: white;
        }

        .slug-editor__button--reload:hover {
          background: #fb8c00;
        }

        .slug-editor__button--edit {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }

        .slug-editor__button--edit:hover {
          background: #ebebeb;
          border-color: #ccc;
        }

        .slug-editor__notice {
          font-size: 11px;
          color: #888;
          margin-top: 8px;
          font-style: italic;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      </style>

      <div class="preview-overlay" role="dialog" aria-modal="true" aria-labelledby="preview-title">
        <div class="preview-overlay__backdrop"></div>
        <div class="preview-overlay__panel">
          <header class="preview-overlay__header">
            <h2 class="preview-overlay__title" id="preview-title">
              <span>K</span>
              Kununu Preview
            </h2>
            <div class="preview-overlay__actions">
              <a href="${kununuUrl}" target="_blank" rel="noopener noreferrer" class="preview-overlay__link" id="openKununuLink">
                Open on Kununu
              </a>
              <button class="preview-overlay__close" aria-label="Close preview" title="Close (Esc)">
                ×
              </button>
            </div>
          </header>
          
          <div class="slug-editor">
            <div class="slug-editor__info">
              Company: <span class="slug-editor__company">${companyDisplay}</span> — 
              Slug: <span class="slug-editor__slug" id="currentSlugDisplay">${currentSlug}</span>
            </div>
            
            <div class="slug-editor__controls" style="display: none;" id="slugEditControls">
              <div class="slug-editor__input-group">
                <input type="text" class="slug-editor__input" id="customSlugInput" 
                       placeholder="de/company-name" value="${currentSlug}">
              </div>
              <div class="slug-editor__actions">
                <button class="slug-editor__button slug-editor__button--save" id="saveSlugButton">
                  Save
                </button>
                <button class="slug-editor__button slug-editor__button--reload" id="reloadIframeButton" title="Reload iframe with slug">
                  Reload
                </button>
                ${hasCompany ? `
                  <button class="slug-editor__button slug-editor__button--reset" id="resetSlugButton" title="Clear saved mapping">
                    Reset
                  </button>
                ` : ''}
              </div>
            </div>
            
            <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
              <button class="slug-editor__button slug-editor__button--edit" id="editSlugButton" style="font-size: 12px; padding: 4px 10px;">
                ✏ Edit
              </button>
              <span class="slug-editor__notice" style="margin: 0;">
                We never send requests; this preview uses an iframe only.
              </span>
            </div>
          </div>
          
          <div class="preview-overlay__content">
            <iframe 
              src="${kununuUrl}" 
              class="preview-overlay__iframe"
              id="kununuIframe"
              referrerpolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              loading="eager"
              title="Kununu Company Profile"
            ></iframe>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    const closeButton = shadowRoot.querySelector('.preview-overlay__close');
    const backdrop = shadowRoot.querySelector('.preview-overlay__backdrop');
    const editButton = shadowRoot.querySelector('#editSlugButton');
    const editControls = shadowRoot.querySelector('#slugEditControls');
    const saveButton = shadowRoot.querySelector('#saveSlugButton');
    const resetButton = shadowRoot.querySelector('#resetSlugButton');
    const reloadButton = shadowRoot.querySelector('#reloadIframeButton');
    const customInput = shadowRoot.querySelector('#customSlugInput');
    const iframe = shadowRoot.querySelector('#kununuIframe');
    const currentSlugDisplay = shadowRoot.querySelector('#currentSlugDisplay');
    const openLink = shadowRoot.querySelector('#openKununuLink');

    const closeHandler = () => closeKununuPreviewOverlay();
    
    if (closeButton) {
      closeButton.addEventListener('click', closeHandler);
    }
    
    if (backdrop) {
      backdrop.addEventListener('click', closeHandler);
    }

    // Edit button handler - toggle edit controls
    if (editButton && editControls) {
      editButton.addEventListener('click', () => {
        const isVisible = editControls.style.display !== 'none';
        editControls.style.display = isVisible ? 'none' : 'flex';
        editButton.textContent = isVisible ? '✏ Edit' : '✕ Cancel';
        
        if (!isVisible && customInput) {
          // Focus input when opening
          customInput.focus();
          customInput.select();
        }
      });
    }

    // Save button handler
    if (saveButton) {
      saveButton.addEventListener('click', async () => {
        const newSlug = customInput ? customInput.value.trim() : currentSlug;
        if (!newSlug) {
          alert('Please enter a valid slug');
          return;
        }

        // Save mapping if we have company info (confirmed by user)
        if (companyInfo?.normalized?.nameNorm) {
          await saveCompanySlug(companyInfo.normalized.nameNorm, newSlug, true);
          console.log('[Kununu AutoSlug] User confirmed mapping:', companyInfo.normalized.nameNorm, '→', newSlug);
          
          // Update display
          currentSlug = newSlug;
          if (currentSlugDisplay) {
            currentSlugDisplay.textContent = newSlug;
          }
          
          // Show feedback
          const originalText = saveButton.textContent;
          saveButton.textContent = '✓ Saved';
          saveButton.style.background = '#4caf50';
          setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.style.background = '';
            
            // Hide edit controls
            if (editControls) {
              editControls.style.display = 'none';
            }
            if (editButton) {
              editButton.textContent = '✏ Edit';
            }
          }, 1500);
        }
      });
    }

    // Reset button handler
    if (resetButton) {
      resetButton.addEventListener('click', async () => {
        if (!companyInfo?.normalized?.nameNorm) return;
        
        if (confirm(`Clear saved mapping for "${companyInfo.raw}"?`)) {
          await removeCompanySlug(companyInfo.normalized.nameNorm);
          console.log('[Kununu AutoSlug] Mapping cleared for:', companyInfo.normalized.nameNorm);
          
          // Show feedback
          const originalText = resetButton.textContent;
          resetButton.textContent = '✓ Cleared';
          setTimeout(() => {
            resetButton.textContent = originalText;
          }, 1500);
        }
      });
    }

    // Reload button handler
    if (reloadButton) {
      reloadButton.addEventListener('click', () => {
        const newSlug = customInput ? customInput.value.trim() : currentSlug;
        if (!newSlug) {
          alert('Please enter a valid slug');
          return;
        }

        // Update iframe and display
        currentSlug = newSlug;
        const newUrl = `https://www.kununu.com/${newSlug}`;
        
        if (iframe) {
          iframe.src = newUrl;
        }
        if (currentSlugDisplay) {
          currentSlugDisplay.textContent = newSlug;
        }
        if (openLink) {
          openLink.href = newUrl;
        }

        console.log('[Kununu AutoSlug] Iframe reloaded with slug:', newSlug);
      });
    }

    // ESC key handler
    const escHandler = (event) => {
      if (event.key === 'Escape') {
        closeKununuPreviewOverlay();
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Store handler for cleanup
    overlayHost._escHandler = escHandler;

    // Append to body
    document.body.appendChild(overlayHost);
  }

  /**
   * Closes the Kununu preview overlay
   */
  function closeKununuPreviewOverlay() {
    const overlayHost = document.getElementById(KUNUNU_OVERLAY_ID);
    if (overlayHost) {
      // Remove ESC handler
      if (overlayHost._escHandler) {
        document.removeEventListener('keydown', overlayHost._escHandler);
      }
      overlayHost.remove();
      console.log('[Kununu] Preview overlay closed');
    }
  }

  /**
   * Inserts the badge into the DOM
   * Ensures idempotency - only inserts once
   */
  async function insertBadge() {
    // Check if already inserted and parent anchor is unchanged
    const existingHost = document.getElementById(KUNUNU_BADGE_HOST_ID);
    if (existingHost && state.isMounted) {
      console.log('[Kununu] badge already mounted, skip');
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

    // Extract company info and compute slug from anchor (if diagnostics is OFF)
    if (!diagnosticsEnabled) {
      await computeCompanyAndSlug(element);
    }

    // Wrap DOM writes with mutation guard
    state.isMutating = true;
    try {
      // Remove existing badge if present
      if (existingHost) {
        existingHost.remove();
        badgeInserted = false;
        badgeShadowRoot = null;
      }

      // Create host element
      const hostElement = document.createElement('div');
      hostElement.id = KUNUNU_BADGE_HOST_ID;
      hostElement.setAttribute('data-kununu-badge', 'true');
      
      // Attach closed Shadow DOM for complete isolation
      const shadowRoot = hostElement.attachShadow({ mode: 'closed' });
      shadowRoot.innerHTML = createBadgeContent();
      
      // Store shadow root reference for event handling
      badgeShadowRoot = shadowRoot;

      // Apply floating class if needed
      if (mode === 'floating') {
        const badge = shadowRoot.querySelector('.kununu-badge');
        if (badge) {
          badge.classList.add('kununu-badge--floating');
        }
      }

      // Add click handler to badge
      const badge = shadowRoot.querySelector('.kununu-badge');
      if (badge) {
        badge.addEventListener('click', () => {
          // Only open preview if diagnostics is OFF
          if (!diagnosticsEnabled) {
            // Use stored slug and company info
            const slug = currentSlug || 'de/sap';
            console.log('[Kununu AutoSlug] Opening preview with slug:', slug);
            openKununuPreviewOverlay(slug, currentCompanyInfo, currentCandidates);
          }
        });
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
      state.isMounted = true;
      console.log(`[Kununu Badge] Badge inserted in ${mode} mode`);
    } finally {
      state.isMutating = false;
    }
  }

  /**
   * Removes the badge from DOM
   */
  function removeBadge() {
    const existingHost = document.getElementById(KUNUNU_BADGE_HOST_ID);
    if (existingHost) {
      existingHost.remove();
      badgeInserted = false;
      badgeShadowRoot = null;
      state.isMounted = false;
      
      // Clear auto-slug state
      currentCompanyInfo = null;
      currentSlug = null;
      currentCandidates = [];
      state.lastCompanyNorm = null;
      state.currentSlug = null;
      
      console.log('[Kununu Badge] Badge removed');
    }
  }

  /**
   * Debounced badge insertion for SPA navigation
   * Recomputes company info and slug on navigation
   */
  function debouncedInsertBadge() {
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }
    
    state.debounceTimer = setTimeout(async () => {
      // Remove old badge if exists (SPA navigation might change layout)
      const existingHost = document.getElementById(KUNUNU_BADGE_HOST_ID);
      if (existingHost) {
        existingHost.remove();
        badgeInserted = false;
        badgeShadowRoot = null;
        state.isMounted = false;
        
        // Clear auto-slug state (will be recomputed)
        currentCompanyInfo = null;
        currentSlug = null;
        currentCandidates = [];
        state.lastCompanyNorm = null;
        state.currentSlug = null;
      }
      
      // Re-insert badge (will recompute company & slug)
      await insertBadge();
    }, DEBOUNCE_MS);
  }

  /**
   * Sets up MutationObserver for SPA navigation resilience
   */
  function setupMutationObserver() {
    if (state.observer) {
      return; // Already set up
    }

    state.observer = new MutationObserver((mutations) => {
      // Skip if we're currently mutating DOM ourselves
      if (state.isMutating) {
        return;
      }

      // Filter out mutations caused by our own elements
      const significantChange = mutations.some(mutation => {
        // Check if any added/removed nodes are our kununu elements
        const hasKununuNodes = (nodes) => {
          return Array.from(nodes).some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              return node.id?.startsWith('kununu-') || 
                     node.className?.includes('kununu-') ||
                     node.getAttribute('data-kununu-');
            }
            return false;
          });
        };

        // Skip if this mutation involves our kununu elements
        if (hasKununuNodes(mutation.addedNodes) || hasKununuNodes(mutation.removedNodes)) {
          return false;
        }

        // Check if target is our kununu element
        if (mutation.target.id?.startsWith('kununu-') || 
            mutation.target.className?.includes('kununu-') ||
            mutation.target.getAttribute('data-kununu-')) {
          return false;
        }

        return mutation.addedNodes.length > 0 || 
               mutation.removedNodes.length > 0 ||
               (mutation.type === 'childList' && mutation.target.tagName === 'BODY');
      });

      if (significantChange) {
        debouncedInsertBadge();
      }
    });

    // Observe body for major changes
    state.observer.observe(document.body, {
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
      
      // Handle companySlugMap changes - only remount if it affects current company
      if (changes.companySlugMap && state.lastCompanyNorm) {
        const newMap = changes.companySlugMap.newValue || {};
        const oldMap = changes.companySlugMap.oldValue || {};
        
        // Check if the change affects our current company
        const currentCompanyChanged = newMap[state.lastCompanyNorm] !== oldMap[state.lastCompanyNorm];
        
        if (currentCompanyChanged) {
          console.log('[Kununu Badge] Company slug mapping changed for current company');
          shouldRefresh = true;
        }
      }
      
      if (shouldRefresh) {
        // Update state
        diagnosticsEnabled = newDiagEnabled;
        diagnosticsSlug = newDiagSlug;
        
        // Switch modes based on new settings
        if (diagnosticsEnabled) {
          // Switch to diagnostics mode
          removeBadge();
          closeKununuPreviewOverlay(); // Close preview overlay if open
          unmountDiagnosticsOverlay(); // Hide existing overlay first
          mountDiagnosticsOverlay(diagnosticsSlug); // Show with new settings
        } else {
          // Switch back to badge mode
          unmountDiagnosticsOverlay();
          closeKununuPreviewOverlay(); // Close preview overlay if open
          insertBadge(); // Async but we don't need to wait
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
      const doInsert = async () => {
        await insertBadge();
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

