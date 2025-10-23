/**
 * Kununu Widget Spike Diagnostics Module
 * 
 * Tests whether Kununu pages/widgets can be embedded via iframe on job site pages.
 * Uses Shadow DOM for complete isolation and provides a diagnostic overlay.
 * 
 * Supported platforms: StepStone, Indeed
 */

(function() {
  'use strict';

  const DIAG_HOST_ID = 'kununu-diag-overlay';
  const PROBE_TIMEOUT_MS = 5000;
  
  let diagOverlay = null;
  let diagShadowRoot = null;
  let probeIframes = [];
  let activeProbes = [];

  /**
   * Generates candidate URLs to test for embedding
   */
  function getCandidateEmbeds(slug) {
    slug = slug || 'de/sap';
    return [
      `https://www.kununu.com/${slug}`,
      'https://www.kununu.com/',
      `https://www.kununu.com/${slug}/kommentare`,
      `https://www.kununu.com/de/bewertungen`
    ];
  }

  /**
   * Creates the diagnostics overlay HTML structure
   */
  function createDiagnosticsContent() {
    return `
      <style>
        :host {
          all: initial;
          display: block;
        }
        
        .diag-overlay {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 500px;
          max-width: calc(100vw - 40px);
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 13px;
          z-index: 2147483647;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .diag-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
          color: white;
          border-radius: 8px 8px 0 0;
        }
        
        .diag-header__title {
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .diag-header__icon {
          width: 20px;
          height: 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }
        
        .diag-header__actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .diag-action-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s ease;
          white-space: nowrap;
        }
        
        .diag-action-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .diag-action-btn:active {
          background: rgba(255, 255, 255, 0.4);
        }
        
        .diag-action-btn--active {
          background: rgba(76, 175, 80, 0.8);
        }
        
        .diag-action-btn--active:hover {
          background: rgba(76, 175, 80, 0.9);
        }
        
        .diag-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: background 0.2s ease;
        }
        
        .diag-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .diag-body {
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .diag-info {
          font-size: 12px;
          color: #666;
          margin-bottom: 12px;
          padding: 8px 12px;
          background: #f0f7ff;
          border-left: 3px solid #2575fc;
          border-radius: 4px;
        }
        
        .diag-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        
        .diag-table th {
          text-align: left;
          padding: 8px;
          background: #f5f5f5;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          color: #666;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .diag-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }
        
        .diag-table tr:last-child td {
          border-bottom: none;
        }
        
        .diag-url {
          font-size: 11px;
          color: #333;
          word-break: break-all;
          font-family: 'Courier New', monospace;
        }
        
        .diag-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .diag-status--pending {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .diag-status--loaded {
          background: #e8f5e9;
          color: #2e7d32;
        }
        
        .diag-status--blocked {
          background: #ffebee;
          color: #c62828;
        }
        
        .diag-status--timeout {
          background: #fff3e0;
          color: #ef6c00;
        }
        
        .diag-icon {
          font-size: 10px;
        }
        
        .diag-iframe-container {
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
        
        .diag-section {
          margin: 16px 0;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 3px solid #6a11cb;
        }
        
        .diag-section-title {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        
        .diag-badge-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .diag-badge-item:last-child {
          border-bottom: none;
        }
        
        .diag-badge-label {
          font-weight: 500;
          color: #555;
        }
        
        .diag-badge-value {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #333;
          max-width: 200px;
          word-break: break-all;
        }
        
        .diag-badge-value-long {
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #333;
          background: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
          max-height: 200px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
          flex: 1;
          margin: 0;
        }
        
        .diag-badge-item--long {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .diag-badge-status {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .diag-badge-status--success {
          background: #e8f5e9;
          color: #2e7d32;
        }
        
        .diag-badge-status--warning {
          background: #fff3e0;
          color: #ef6c00;
        }
        
        .diag-badge-status--error {
          background: #ffebee;
          color: #c62828;
        }
        
        .diag-footer {
          padding: 12px 16px;
          background: #f9f9f9;
          border-radius: 0 0 8px 8px;
          font-size: 11px;
          color: #999;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
      </style>
      
      <div class="diag-overlay" role="dialog" aria-labelledby="diag-title">
        <div class="diag-header">
          <div class="diag-header__title" id="diag-title">
            <span class="diag-header__icon">🔬</span>
            Kununu Widget Spike
          </div>
          <div class="diag-header__actions">
            <button class="diag-action-btn" id="diagCopy" aria-label="Copy diagnostics" title="Copy diagnostics to clipboard">
              📋 Copy
            </button>
            <button class="diag-action-btn" id="diagToggleHighlight" aria-label="Toggle extraction highlights" title="Show/hide extraction highlights">
              👁️ Highlights
            </button>
            <button class="diag-close" id="diagClose" aria-label="Close diagnostics" title="Close (Esc)">×</button>
          </div>
        </div>
        
        <div class="diag-body">
          <div class="diag-info">
            Testing iframe embedding of Kununu URLs on this StepStone page. Results show whether Content Security Policy allows embedding.
          </div>
          
          <div class="diag-section">
            <h3 class="diag-section-title">Badge Diagnostics</h3>
            <div id="badgeDiagnostics">
              <!-- Badge diagnostics will be inserted here -->
            </div>
          </div>
          
          <table class="diag-table">
            <thead>
              <tr>
                <th>Candidate URL</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="diagResults">
              <!-- Results will be inserted here -->
            </tbody>
          </table>
        </div>
        
        <div class="diag-iframe-container" id="iframeContainer"></div>
        
        <div class="diag-footer">
          Press Esc or click × to close • Diagnostics mode active
        </div>
      </div>
    `;
  }

  /**
   * Creates badge diagnostics HTML from diagnostic data
   */
  function createBadgeDiagnosticsHTML(diagnostics) {
    if (!diagnostics) {
      return '<div class="diag-badge-item"><span class="diag-badge-label">Error:</span><span class="diag-badge-value">No diagnostic data available</span></div>';
    }

    const items = [];

    // Page type and badge status
    items.push({
      label: 'Page Type',
      value: diagnostics.pageType,
      status: diagnostics.jobDetailPage ? 'success' : 'warning'
    });

    items.push({
      label: 'Badge Enabled',
      value: diagnostics.badgeEnabled ? 'Yes' : 'No',
      status: diagnostics.badgeEnabled ? 'success' : 'error'
    });

    items.push({
      label: 'Show badge on this tab',
      value: diagnostics.badgeEnabled ? 'Enabled' : 'Disabled',
      status: diagnostics.badgeEnabled ? 'success' : 'error'
    });

    items.push({
      label: 'Job Detail Page',
      value: diagnostics.jobDetailPage ? 'Yes' : 'No',
      status: diagnostics.jobDetailPage ? 'success' : 'warning'
    });

    // Element detection
    if (diagnostics.elements) {
      items.push({
        label: 'job-ad-display-du9bhi',
        value: diagnostics.elements.jobAdDisplay?.exists ? 'Found' : 'Not found',
        status: diagnostics.elements.jobAdDisplay?.exists ? 'success' : 'error'
      });

      if (diagnostics.elements.jobAdDisplay?.spanText) {
        items.push({
          label: 'Company Name',
          value: diagnostics.elements.jobAdDisplay.spanText,
          status: 'success'
        });
      }

      items.push({
        label: 'header-company-name',
        value: diagnostics.elements.headerCompanyName?.exists ? 'Found' : 'Not found',
        status: diagnostics.elements.headerCompanyName?.exists ? 'success' : 'warning'
      });

      items.push({
        label: 'Existing Badge',
        value: diagnostics.elements.existingBadge?.exists ? 'Present' : 'Not present',
        status: diagnostics.elements.existingBadge?.exists ? 'success' : 'warning'
      });
    }

    // Extraction results
    if (diagnostics.extraction) {
      items.push({
        label: 'Extraction Success',
        value: diagnostics.extraction.success ? 'Yes' : 'No',
        status: diagnostics.extraction.success ? 'success' : 'error'
      });

      if (diagnostics.extraction.raw) {
        items.push({
          label: 'Extracted Name',
          value: diagnostics.extraction.raw,
          status: 'success'
        });
      }

      if (diagnostics.extraction.tokens) {
        const tokens = Object.entries(diagnostics.extraction.tokens)
          .filter(([key, value]) => value)
          .map(([key]) => key.toUpperCase())
          .join(', ');
        
        if (tokens) {
          items.push({
            label: 'Detected Suffixes',
            value: tokens,
            status: 'success'
          });
        }
      }
    }

    // Job extraction results
    if (diagnostics.jobExtraction) {
      items.push({
        label: '--- Job Extraction ---',
        value: '',
        status: 'info'
      });

      items.push({
        label: 'Extraction Success',
        value: diagnostics.jobExtraction.success ? 'Yes' : 'No',
        status: diagnostics.jobExtraction.success ? 'success' : 'error'
      });

      if (diagnostics.jobExtraction.error) {
        items.push({
          label: 'Extraction Error',
          value: diagnostics.jobExtraction.error,
          status: 'error'
        });
      }

      if (diagnostics.jobExtraction.title) {
        items.push({
          label: 'Job Title',
          value: diagnostics.jobExtraction.title,
          status: 'success'
        });
      }

      if (diagnostics.jobExtraction.company) {
        items.push({
          label: 'Company',
          value: diagnostics.jobExtraction.company,
          status: 'success'
        });
      }

      items.push({
        label: 'Description Length',
        value: `${diagnostics.jobExtraction.descriptionLength} characters`,
        status: diagnostics.jobExtraction.descriptionLength > 100 ? 'success' : 'error'
      });

      items.push({
        label: 'Requirements Length',
        value: `${diagnostics.jobExtraction.requirementsLength} characters`,
        status: diagnostics.jobExtraction.requirementsLength > 0 ? 'success' : 'warning'
      });

      // Add full job description preview
      if (diagnostics.jobExtraction.fullDescription) {
        items.push({
          label: 'Description Preview (First 500 chars)',
          value: diagnostics.jobExtraction.fullDescription.substring(0, 500) + (diagnostics.jobExtraction.fullDescription.length > 500 ? '...' : ''),
          status: 'info',
          isLongText: true
        });
      }
    }

    // Anchor results
    if (diagnostics.anchor) {
      items.push({
        label: 'Anchor Found',
        value: diagnostics.anchor.success ? 'Yes' : 'No',
        status: diagnostics.anchor.success ? 'success' : 'error'
      });

      if (diagnostics.anchor.element) {
        items.push({
          label: 'Anchor Element',
          value: diagnostics.anchor.element,
          status: 'success'
        });
      }

      if (diagnostics.anchor.mode) {
        items.push({
          label: 'Anchor Mode',
          value: diagnostics.anchor.mode,
          status: 'success'
        });
      }
    }

    // Errors
    if (diagnostics.errors && diagnostics.errors.length > 0) {
      items.push({
        label: 'Errors',
        value: `${diagnostics.errors.length} error(s)`,
        status: 'error'
      });
    }

    return items.map(item => {
      const isLongText = item.isLongText || item.value.length > 100;
      const statusIcon = item.status === 'success' ? '✓' : 
                        item.status === 'warning' ? '⚠' : 
                        item.status === 'info' ? 'ℹ' : '✗';
      
      if (isLongText) {
        return `
          <div class="diag-badge-item diag-badge-item--long">
            <span class="diag-badge-label">${item.label}:</span>
            <div style="display: flex; align-items: flex-start; gap: 8px; margin-top: 4px;">
              <pre class="diag-badge-value-long">${item.value}</pre>
              <span class="diag-badge-status diag-badge-status--${item.status}">
                ${statusIcon}
              </span>
            </div>
          </div>
        `;
      }
      
      return `
        <div class="diag-badge-item">
          <span class="diag-badge-label">${item.label}:</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="diag-badge-value">${item.value}</span>
            <span class="diag-badge-status diag-badge-status--${item.status}">
              ${statusIcon}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Creates a result row for the diagnostics table
   */
  function createResultRow(url, status) {
    const statusClasses = {
      pending: 'diag-status--pending',
      loaded: 'diag-status--loaded',
      blocked: 'diag-status--blocked',
      timeout: 'diag-status--timeout'
    };
    
    const statusIcons = {
      pending: '⏳',
      loaded: '✓',
      blocked: '✗',
      timeout: '⏱'
    };
    
    const statusLabels = {
      pending: 'Testing...',
      loaded: 'Loaded',
      blocked: 'Blocked',
      timeout: 'Timeout'
    };
    
    return `
      <tr data-url="${url}">
        <td class="diag-url">${url}</td>
        <td>
          <span class="diag-status ${statusClasses[status]}">
            <span class="diag-icon">${statusIcons[status]}</span>
            ${statusLabels[status]}
          </span>
        </td>
      </tr>
    `;
  }

  /**
   * Updates the status of a specific URL in the results table
   */
  function updateResultStatus(url, status) {
    if (!diagShadowRoot) return;
    
    const resultsBody = diagShadowRoot.getElementById('diagResults');
    if (!resultsBody) return;
    
    const row = resultsBody.querySelector(`tr[data-url="${url}"]`);
    if (!row) return;
    
    const statusCell = row.querySelector('td:last-child');
    if (!statusCell) return;
    
    const statusClasses = {
      pending: 'diag-status--pending',
      loaded: 'diag-status--loaded',
      blocked: 'diag-status--blocked',
      timeout: 'diag-status--timeout'
    };
    
    const statusIcons = {
      pending: '⏳',
      loaded: '✓',
      blocked: '✗',
      timeout: '⏱'
    };
    
    const statusLabels = {
      pending: 'Testing...',
      loaded: 'Loaded',
      blocked: 'Blocked',
      timeout: 'Timeout'
    };
    
    statusCell.innerHTML = `
      <span class="diag-status ${statusClasses[status]}">
        <span class="diag-icon">${statusIcons[status]}</span>
        ${statusLabels[status]}
      </span>
    `;
  }

  /**
   * Probes a single URL by attempting to load it in an iframe
   */
  function probeUrl(url, iframeContainer) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      console.group('[Kununu-Widget-Spike]', url);
      console.log('Start time:', new Date().toISOString());
      
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.referrerPolicy = 'no-referrer';
      iframe.sandbox = '';
      iframe.style.cssText = 'visibility:hidden;width:0;height:0;border:0;position:absolute;';
      
      let resolved = false;
      let timeoutId = null;
      
      const cleanup = (status, details) => {
        if (resolved) return;
        resolved = true;
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        const duration = Date.now() - startTime;
        console.log('Status:', status);
        console.log('Duration:', duration + 'ms');
        console.log('Details:', details);
        console.groupEnd();
        
        updateResultStatus(url, status);
        resolve({ url, status, duration, details });
      };
      
      iframe.addEventListener('load', () => {
        cleanup('loaded', 'iframe load event fired');
      });
      
      iframe.addEventListener('error', (e) => {
        cleanup('blocked', `iframe error event: ${e.message || 'unknown'}`);
      });
      
      timeoutId = setTimeout(() => {
        cleanup('timeout', `No load/error event within ${PROBE_TIMEOUT_MS}ms`);
      }, PROBE_TIMEOUT_MS);
      
      // Store iframe reference for cleanup
      probeIframes.push(iframe);
      
      // Append to container
      iframeContainer.appendChild(iframe);
      
      console.log('iframe created and appended');
    });
  }

  /**
   * Runs all probes sequentially
   */
  async function runProbes(slug) {
    const candidates = getCandidateEmbeds(slug);
    const iframeContainer = diagShadowRoot.getElementById('iframeContainer');
    
    if (!iframeContainer) {
      console.error('[Kununu-Widget-Spike] iframe container not found');
      return;
    }
    
    // Initialize results table
    const resultsBody = diagShadowRoot.getElementById('diagResults');
    if (resultsBody) {
      resultsBody.innerHTML = candidates.map(url => createResultRow(url, 'pending')).join('');
    }
    
    console.log('[Kununu-Widget-Spike] Starting probes for', candidates.length, 'URLs');
    
    // Run probes in parallel (not sequentially as I said above, parallel is better for speed)
    const probePromises = candidates.map(url => probeUrl(url, iframeContainer));
    activeProbes.push(...probePromises);
    
    const results = await Promise.all(probePromises);
    
    console.log('[Kununu-Widget-Spike] All probes completed:', results);
    
    return results;
  }

  /**
   * Shows the diagnostics overlay
   */
  function showDiagnostics(slug) {
    // Remove any existing overlay first
    hideDiagnostics();
    
    console.log('[Kununu-Widget-Spike] Initializing diagnostics overlay with slug:', slug);
    
    // Create host element
    diagOverlay = document.createElement('div');
    diagOverlay.id = DIAG_HOST_ID;
    diagOverlay.setAttribute('data-kununu-diagnostics', 'true');
    
    // Attach Shadow DOM
    diagShadowRoot = diagOverlay.attachShadow({ mode: 'open' });
    diagShadowRoot.innerHTML = createDiagnosticsContent();
    
    // Append to body
    document.body.appendChild(diagOverlay);
    
    // Setup close button
    const closeButton = diagShadowRoot.getElementById('diagClose');
    if (closeButton) {
      closeButton.addEventListener('click', hideDiagnostics);
    }
    
    // Setup copy button
    const copyButton = diagShadowRoot.getElementById('diagCopy');
    if (copyButton) {
      copyButton.addEventListener('click', copyDiagnosticsToClipboard);
    }
    
    // Setup highlight toggle button
    const highlightButton = diagShadowRoot.getElementById('diagToggleHighlight');
    if (highlightButton) {
      highlightButton.addEventListener('click', toggleExtractionHighlights);
    }
    
    // Setup ESC key handler
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        hideDiagnostics();
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Store the handler for cleanup
    diagOverlay._escapeHandler = handleEscape;
    
    // Gather badge diagnostics
    try {
      // Try to call the gatherBadgeDiagnostics function from content.js
      if (typeof window.gatherBadgeDiagnostics === 'function') {
        const badgeDiagnostics = window.gatherBadgeDiagnostics();
        const badgeDiagnosticsHTML = createBadgeDiagnosticsHTML(badgeDiagnostics);
        const badgeDiagnosticsContainer = diagShadowRoot.getElementById('badgeDiagnostics');
        if (badgeDiagnosticsContainer) {
          badgeDiagnosticsContainer.innerHTML = badgeDiagnosticsHTML;
        }
      } else {
        // Fallback if function is not available
        const badgeDiagnosticsContainer = diagShadowRoot.getElementById('badgeDiagnostics');
        if (badgeDiagnosticsContainer) {
          badgeDiagnosticsContainer.innerHTML = '<div class="diag-badge-item"><span class="diag-badge-label">Error:</span><span class="diag-badge-value">Badge diagnostics not available</span></div>';
        }
      }
    } catch (error) {
      console.error('[Kununu-Widget-Spike] Error gathering badge diagnostics:', error);
      const badgeDiagnosticsContainer = diagShadowRoot.getElementById('badgeDiagnostics');
      if (badgeDiagnosticsContainer) {
        badgeDiagnosticsContainer.innerHTML = '<div class="diag-badge-item"><span class="diag-badge-label">Error:</span><span class="diag-badge-value">' + error.message + '</span></div>';
      }
    }
    
    // Run probes
    runProbes(slug);
    
    console.log('[Kununu-Widget-Spike] Diagnostics overlay shown');
  }

  /**
   * Hides and cleans up the diagnostics overlay
   */
  /**
   * Copies diagnostic results to clipboard
   */
  function copyDiagnosticsToClipboard() {
    try {
      // Gather diagnostics data
      const diagnostics = window.gatherBadgeDiagnostics ? window.gatherBadgeDiagnostics() : null;
      
      if (!diagnostics) {
        alert('No diagnostic data available');
        return;
      }

      // Format diagnostics as text
      let text = '=== Company Lens Diagnostics ===\n\n';
      text += `Timestamp: ${diagnostics.timestamp}\n`;
      text += `URL: ${diagnostics.url}\n`;
      text += `Page Type: ${diagnostics.pageType}\n`;
      text += `Job Detail Page: ${diagnostics.jobDetailPage ? 'Yes' : 'No'}\n`;
      text += `Badge Enabled: ${diagnostics.badgeEnabled ? 'Yes' : 'No'}\n\n`;

      // Elements
      text += '--- Elements ---\n';
      if (diagnostics.elements) {
        text += `Indeed Company (.e1wnkr790): ${diagnostics.elements.indeedCompany?.exists ? 'Found' : 'Not found'}\n`;
        if (diagnostics.elements.indeedCompany?.linkText) {
          text += `  Company Name: ${diagnostics.elements.indeedCompany.linkText}\n`;
        }
        text += `StepStone Job Ad (.job-ad-display-du9bhi): ${diagnostics.elements.jobAdDisplay?.exists ? 'Found' : 'Not found'}\n`;
        if (diagnostics.elements.jobAdDisplay?.spanText) {
          text += `  Company Name: ${diagnostics.elements.jobAdDisplay.spanText}\n`;
        }
        text += `Existing Badge: ${diagnostics.elements.existingBadge?.exists ? 'Present' : 'Not present'}\n`;
      }
      text += '\n';

      // Extraction
      text += '--- Company Extraction ---\n';
      if (diagnostics.extraction) {
        text += `Success: ${diagnostics.extraction.success ? 'Yes' : 'No'}\n`;
        text += `Extracted Name: ${diagnostics.extraction.raw || 'N/A'}\n`;
        text += `Anchor: ${diagnostics.extraction.anchor || 'N/A'}\n`;
        if (diagnostics.extraction.tokens) {
          const tokens = Object.entries(diagnostics.extraction.tokens)
            .filter(([, value]) => value)
            .map(([key]) => key.toUpperCase())
            .join(', ');
          if (tokens) {
            text += `Detected Suffixes: ${tokens}\n`;
          }
        }
      }
      text += '\n';

      // Job Extraction
      text += '--- Job Extraction ---\n';
      if (diagnostics.jobExtraction) {
        text += `Success: ${diagnostics.jobExtraction.success ? 'Yes' : 'No'}\n`;
        if (diagnostics.jobExtraction.error) {
          text += `Error: ${diagnostics.jobExtraction.error}\n`;
        }
        text += `Title: ${diagnostics.jobExtraction.title}\n`;
        text += `Company: ${diagnostics.jobExtraction.company}\n`;
        text += `Description Length: ${diagnostics.jobExtraction.descriptionLength} characters\n`;
        text += `Requirements Length: ${diagnostics.jobExtraction.requirementsLength} characters\n`;
        if (diagnostics.jobExtraction.fullDescription) {
          text += `\nDescription Preview (first 500 chars):\n${diagnostics.jobExtraction.fullDescription.substring(0, 500)}${diagnostics.jobExtraction.fullDescription.length > 500 ? '...' : ''}\n`;
        }
      }
      text += '\n';

      // Anchor
      text += '--- Anchor ---\n';
      if (diagnostics.anchor) {
        text += `Found: ${diagnostics.anchor.success ? 'Yes' : 'No'}\n`;
        text += `Element: ${diagnostics.anchor.element || 'N/A'}\n`;
        text += `Mode: ${diagnostics.anchor.mode || 'N/A'}\n`;
      }
      text += '\n';

      // Errors
      if (diagnostics.errors && diagnostics.errors.length > 0) {
        text += '--- Errors ---\n';
        diagnostics.errors.forEach((error, index) => {
          text += `${index + 1}. ${error.type}: ${error.message}\n`;
        });
        text += '\n';
      }

      text += '=== End of Diagnostics ===';

      // Copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const copyButton = diagShadowRoot.getElementById('diagCopy');
        if (copyButton) {
          const originalText = copyButton.textContent;
          copyButton.textContent = '✓ Copied!';
          setTimeout(() => {
            copyButton.textContent = originalText;
          }, 2000);
        }
        console.log('[Company Lens] Diagnostics copied to clipboard');
      }).catch(err => {
        console.error('[Company Lens] Failed to copy diagnostics:', err);
        alert('Failed to copy to clipboard: ' + err.message);
      });
    } catch (error) {
      console.error('[Company Lens] Error copying diagnostics:', error);
      alert('Error copying diagnostics: ' + error.message);
    }
  }

  // State for extraction highlights
  let highlightsVisible = false;
  let highlightOverlays = [];

  /**
   * Toggles visual highlights of extracted elements
   */
  function toggleExtractionHighlights() {
    highlightsVisible = !highlightsVisible;
    
    const highlightButton = diagShadowRoot.getElementById('diagToggleHighlight');
    
    if (highlightsVisible) {
      // Show highlights
      showExtractionHighlights();
      if (highlightButton) {
        highlightButton.classList.add('diag-action-btn--active');
        highlightButton.textContent = '👁️ Hide';
      }
    } else {
      // Hide highlights
      hideExtractionHighlights();
      if (highlightButton) {
        highlightButton.classList.remove('diag-action-btn--active');
        highlightButton.textContent = '👁️ Highlights';
      }
    }
  }

  /**
   * Shows visual highlights on extracted elements
   */
  function showExtractionHighlights() {
    // Clear any existing highlights
    hideExtractionHighlights();

    const highlights = [];

    // Highlight job description element
    const jobDescSelectors = [
      '.eu4oa1w0',
      '#jobDescriptionText',
      'div[id*="jobDescription"]',
      'div[class*="jobDescription"]',
      '.jobsearch-jobDescriptionText',
      '.jobsearch-JobComponent',
      '[data-at="jobad-description"]',
      '.job-description'
    ];

    for (const selector of jobDescSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.length > 100) {
        highlights.push({
          element: element,
          label: `Job Description (${selector})`,
          color: 'rgba(76, 175, 80, 0.3)' // Green
        });
        break; // Only highlight the first match
      }
    }

    // Highlight company name element
    const companySelectors = [
      '.e1wnkr790',
      '.job-ad-display-du9bhi',
      '[data-at="header-company-name"]',
      '[data-at="jobad-header-company-name"]'
    ];

    for (const selector of companySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        highlights.push({
          element: element,
          label: `Company Name (${selector})`,
          color: 'rgba(33, 150, 243, 0.3)' // Blue
        });
        break; // Only highlight the first match
      }
    }

    // Highlight job title element
    const titleSelectors = [
      'h1[data-at="header-job-title"]',
      'h1.jobsearch-JobInfoHeader-title',
      'h1[class*="job-title"]',
      'h1[class*="JobTitle"]'
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        highlights.push({
          element: element,
          label: `Job Title (${selector})`,
          color: 'rgba(255, 193, 7, 0.3)' // Amber
        });
        break; // Only highlight the first match
      }
    }

    // Create highlight overlays
    highlights.forEach(highlight => {
      const rect = highlight.element.getBoundingClientRect();
      
      // Create overlay div
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: ${rect.top + window.scrollY}px;
        left: ${rect.left + window.scrollX}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: ${highlight.color};
        border: 2px solid ${highlight.color.replace('0.3', '1')};
        pointer-events: none;
        z-index: 999998;
        box-sizing: border-box;
        transition: all 0.3s ease;
      `;
      
      // Create label
      const label = document.createElement('div');
      label.style.cssText = `
        position: absolute;
        top: -24px;
        left: 0;
        background: ${highlight.color.replace('0.3', '0.9')};
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      `;
      label.textContent = highlight.label;
      
      overlay.appendChild(label);
      document.body.appendChild(overlay);
      
      highlightOverlays.push(overlay);
    });

    console.log('[Company Lens] Showing', highlightOverlays.length, 'extraction highlights');
  }

  /**
   * Hides extraction highlights
   */
  function hideExtractionHighlights() {
    highlightOverlays.forEach(overlay => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    highlightOverlays = [];
    console.log('[Company Lens] Extraction highlights hidden');
  }

  function hideDiagnostics() {
    if (diagOverlay) {
      // Hide any visible highlights
      hideExtractionHighlights();
      highlightsVisible = false;
      
      // Remove ESC key handler
      if (diagOverlay._escapeHandler) {
        document.removeEventListener('keydown', diagOverlay._escapeHandler);
      }
      
      // Remove overlay
      diagOverlay.remove();
      diagOverlay = null;
      diagShadowRoot = null;
      
      console.log('[Kununu-Widget-Spike] Diagnostics overlay removed');
    }
    
    // Clean up all iframes
    probeIframes.forEach(iframe => {
      if (iframe && iframe.parentNode) {
        iframe.remove();
      }
    });
    probeIframes = [];
    activeProbes = [];
    
    console.log('[Kununu-Widget-Spike] Cleanup complete');
  }

  /**
   * Checks if diagnostics overlay is currently visible
   */
  function isDiagnosticsVisible() {
    return diagOverlay !== null && document.getElementById(DIAG_HOST_ID) !== null;
  }

  // Export functions
  window.KununuDiagnostics = {
    show: showDiagnostics,
    hide: hideDiagnostics,
    isVisible: isDiagnosticsVisible
  };

})();

