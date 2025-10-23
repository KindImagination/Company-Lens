/**
 * Company Lens Side Panel Script
 * Displays CV comparison results
 */

(function() {
  'use strict';

  // State
  let currentComparison = null;

  // Elements
  const elements = {
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    resultsState: document.getElementById('resultsState'),
    errorMessage: document.getElementById('errorMessage'),
    retryButton: document.getElementById('retryButton'),
    closeButton: document.getElementById('closeButton'),
    
    // Job info
    jobTitle: document.getElementById('jobTitle'),
    jobCompany: document.getElementById('jobCompany'),
    
    // Score
    scoreNumber: document.getElementById('scoreNumber'),
    scoreProgress: document.getElementById('scoreProgress'),
    
    // Summary
    summaryText: document.getElementById('summaryText'),
    
    // Tabs
    tabSummary: document.getElementById('tabSummary'),
    tabDetailed: document.getElementById('tabDetailed'),
    summaryView: document.getElementById('summaryView'),
    detailedView: document.getElementById('detailedView'),
    
    // Skills
    matchingSkills: document.getElementById('matchingSkills'),
    missingSkills: document.getElementById('missingSkills'),
    
    // Recommendations
    quickRecommendations: document.getElementById('quickRecommendations'),
    detailedRecommendations: document.getElementById('detailedRecommendations'),
    
    // Detailed view
    strengthsText: document.getElementById('strengthsText'),
    gapsText: document.getElementById('gapsText'),
    experienceText: document.getElementById('experienceText'),
    educationText: document.getElementById('educationText')
  };

  /**
   * Initialize the side panel
   */
  function init() {
    console.log('[Company Lens] Side panel initialized');
    
    // Set up event listeners
    setupEventListeners();
    
    // Load comparison data from storage
    loadComparisonData();
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    // Tab switching
    elements.tabSummary.addEventListener('click', () => switchTab('summary'));
    elements.tabDetailed.addEventListener('click', () => switchTab('detailed'));
    
    // Close button
    elements.closeButton.addEventListener('click', closeSidePanel);
    
    // Retry button
    elements.retryButton.addEventListener('click', retryComparison);
  }

  /**
   * Switch between tabs
   */
  function switchTab(tab) {
    if (tab === 'summary') {
      elements.tabSummary.classList.add('tabs__tab--active');
      elements.tabDetailed.classList.remove('tabs__tab--active');
      elements.summaryView.classList.add('tab-content--active');
      elements.summaryView.style.display = 'block';
      elements.detailedView.classList.remove('tab-content--active');
      elements.detailedView.style.display = 'none';
    } else {
      elements.tabDetailed.classList.add('tabs__tab--active');
      elements.tabSummary.classList.remove('tabs__tab--active');
      elements.detailedView.classList.add('tab-content--active');
      elements.detailedView.style.display = 'block';
      elements.summaryView.classList.remove('tab-content--active');
      elements.summaryView.style.display = 'none';
    }
  }

  /**
   * Close the side panel
   */
  function closeSidePanel() {
    window.close();
  }

  /**
   * Retry comparison
   */
  function retryComparison() {
    // Send message to content script to retry
    chrome.runtime.sendMessage({ type: 'RETRY_COMPARISON' }, response => {
      if (response && response.success) {
        showLoading();
      }
    });
  }

  /**
   * Load comparison data from chrome.storage
   */
  async function loadComparisonData() {
    try {
      const result = await chrome.storage.local.get('companyLens_lastComparison');
      const data = result.companyLens_lastComparison;
      
      if (!data) {
        showError('No comparison data found. Please run a comparison first.');
        return;
      }
      
      if (data.error) {
        showError(data.error);
        return;
      }
      
      if (data.comparison) {
        displayComparison(data.comparison, data.jobDescription);
      }
    } catch (error) {
      console.error('[Company Lens] Error loading comparison data:', error);
      showError('Failed to load comparison data.');
    }
  }

  /**
   * Show loading state
   */
  function showLoading() {
    elements.loadingState.style.display = 'flex';
    elements.errorState.style.display = 'none';
    elements.resultsState.style.display = 'none';
  }

  /**
   * Show error state
   */
  function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorState.style.display = 'flex';
    elements.loadingState.style.display = 'none';
    elements.resultsState.style.display = 'none';
  }

  /**
   * Display comparison results
   */
  function displayComparison(comparison, jobDescription) {
    currentComparison = comparison;
    
    // Show results state
    elements.resultsState.style.display = 'block';
    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'none';
    
    // Display job info
    if (jobDescription) {
      elements.jobTitle.textContent = jobDescription.title || 'Job Position';
      elements.jobCompany.textContent = jobDescription.company || 'Company';
    }
    
    // Display match score
    displayMatchScore(comparison.matchScore || 0);
    
    // Display summary
    elements.summaryText.textContent = comparison.summary || 'No summary available.';
    
    // Display skills
    displaySkills(comparison.matchingSkills || [], comparison.missingSkills || []);
    
    // Display recommendations
    displayRecommendations(comparison.recommendations || []);
    
    // Display detailed analysis
    displayDetailedAnalysis(comparison.detailedAnalysis || {});
  }

  /**
   * Display match score with animation
   */
  function displayMatchScore(score) {
    const clampedScore = Math.max(0, Math.min(100, score));
    
    // Animate number
    animateNumber(elements.scoreNumber, 0, clampedScore, 1000);
    
    // Animate circle
    const circumference = 2 * Math.PI * 45; // radius = 45
    const offset = circumference - (clampedScore / 100) * circumference;
    
    setTimeout(() => {
      elements.scoreProgress.style.strokeDashoffset = offset;
      
      // Set color based on score
      if (clampedScore >= 70) {
        elements.scoreProgress.classList.add('match-score__progress--high');
      } else if (clampedScore >= 50) {
        elements.scoreProgress.classList.add('match-score__progress--medium');
      } else {
        elements.scoreProgress.classList.add('match-score__progress--low');
      }
    }, 100);
  }

  /**
   * Animate number counter
   */
  function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeOut);
      
      element.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }

  /**
   * Display skills lists
   */
  function displaySkills(matchingSkills, missingSkills) {
    // Matching skills
    if (matchingSkills.length > 0) {
      elements.matchingSkills.innerHTML = matchingSkills
        .slice(0, 15) // Limit to 15 skills
        .map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
        .join('');
    } else {
      elements.matchingSkills.innerHTML = '<div class="skills-list--empty">No matching skills identified</div>';
    }
    
    // Missing skills
    if (missingSkills.length > 0) {
      elements.missingSkills.innerHTML = missingSkills
        .slice(0, 15) // Limit to 15 skills
        .map(skill => `<span class="skill-tag skill-tag--missing">${escapeHtml(skill)}</span>`)
        .join('');
    } else {
      elements.missingSkills.innerHTML = '<div class="skills-list--empty">No gaps identified</div>';
    }
  }

  /**
   * Display recommendations
   */
  function displayRecommendations(recommendations) {
    if (recommendations.length > 0) {
      // Quick recommendations (first 3)
      const quickRecs = recommendations.slice(0, 3);
      elements.quickRecommendations.innerHTML = quickRecs
        .map(rec => `<li>${escapeHtml(rec)}</li>`)
        .join('');
      
      // Detailed recommendations (all)
      elements.detailedRecommendations.innerHTML = recommendations
        .map(rec => `<li>${escapeHtml(rec)}</li>`)
        .join('');
    } else {
      elements.quickRecommendations.innerHTML = '<li>No specific recommendations available.</li>';
      elements.detailedRecommendations.innerHTML = '<li>No specific recommendations available.</li>';
    }
  }

  /**
   * Display detailed analysis
   */
  function displayDetailedAnalysis(analysis) {
    elements.strengthsText.textContent = analysis.strengths || 'No detailed strengths analysis available.';
    elements.gapsText.textContent = analysis.gaps || 'No detailed gaps analysis available.';
    elements.experienceText.textContent = analysis.experience || 'No detailed experience assessment available.';
    elements.educationText.textContent = analysis.education || 'No detailed education assessment available.';
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Listen for storage changes (real-time updates)
   */
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.companyLens_lastComparison) {
      const newData = changes.companyLens_lastComparison.newValue;
      
      if (newData && newData.comparison) {
        displayComparison(newData.comparison, newData.jobDescription);
      } else if (newData && newData.error) {
        showError(newData.error);
      }
    }
  });

  // Initialize on load
  init();

})();

