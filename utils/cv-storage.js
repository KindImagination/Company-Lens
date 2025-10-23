/**
 * CV Storage Module
 * Handles storing and retrieving CV files and API keys in chrome.storage.local
 */

// Storage keys
const STORAGE_KEYS = {
  CV_TEXT: 'companyLens_cvText',
  CV_METADATA: 'companyLens_cvMetadata',
  API_KEY: 'companyLens_apiKey'
};

// Size limit (5MB for Chrome local storage, use 4MB to be safe)
const MAX_CV_SIZE = 4 * 1024 * 1024; // 4MB in bytes

/**
 * Stores CV text and metadata
 * @param {string} text - Parsed CV text
 * @param {object} metadata - { filename, size, uploadDate, fileType }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function storeCV(text, metadata) {
  try {
    // Check size
    const textSize = new Blob([text]).size;
    if (textSize > MAX_CV_SIZE) {
      return {
        success: false,
        error: `CV is too large (${(textSize / 1024 / 1024).toFixed(2)}MB). Maximum size is 4MB. Please use a smaller file.`
      };
    }

    // Store in chrome.storage.local
    await chrome.storage.local.set({
      [STORAGE_KEYS.CV_TEXT]: text,
      [STORAGE_KEYS.CV_METADATA]: {
        ...metadata,
        uploadDate: new Date().toISOString()
      }
    });

    console.log('[Company Lens] CV stored successfully');
    return { success: true };
  } catch (error) {
    console.error('[Company Lens] Error storing CV:', error);
    return {
      success: false,
      error: `Failed to store CV: ${error.message}`
    };
  }
}

/**
 * Retrieves stored CV text
 * @returns {Promise<string|null>}
 */
async function getCV() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CV_TEXT);
    return result[STORAGE_KEYS.CV_TEXT] || null;
  } catch (error) {
    console.error('[Company Lens] Error retrieving CV:', error);
    return null;
  }
}

/**
 * Retrieves CV metadata
 * @returns {Promise<object|null>}
 */
async function getCVMetadata() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CV_METADATA);
    return result[STORAGE_KEYS.CV_METADATA] || null;
  } catch (error) {
    console.error('[Company Lens] Error retrieving CV metadata:', error);
    return null;
  }
}

/**
 * Deletes stored CV and metadata
 * @returns {Promise<{success: boolean}>}
 */
async function deleteCV() {
  try {
    await chrome.storage.local.remove([
      STORAGE_KEYS.CV_TEXT,
      STORAGE_KEYS.CV_METADATA
    ]);
    console.log('[Company Lens] CV deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('[Company Lens] Error deleting CV:', error);
    return { success: false };
  }
}

/**
 * Stores DeepSeek API key
 * @param {string} apiKey - The API key
 * @returns {Promise<{success: boolean}>}
 */
async function storeAPIKey(apiKey) {
  try {
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, error: 'API key cannot be empty' };
    }

    await chrome.storage.local.set({
      [STORAGE_KEYS.API_KEY]: apiKey.trim()
    });

    console.log('[Company Lens] API key stored successfully');
    return { success: true };
  } catch (error) {
    console.error('[Company Lens] Error storing API key:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves stored API key
 * @returns {Promise<string|null>}
 */
async function getAPIKey() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
    return result[STORAGE_KEYS.API_KEY] || null;
  } catch (error) {
    console.error('[Company Lens] Error retrieving API key:', error);
    return null;
  }
}

/**
 * Deletes stored API key
 * @returns {Promise<{success: boolean}>}
 */
async function deleteAPIKey() {
  try {
    await chrome.storage.local.remove(STORAGE_KEYS.API_KEY);
    console.log('[Company Lens] API key deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('[Company Lens] Error deleting API key:', error);
    return { success: false };
  }
}

/**
 * Checks if CV is stored
 * @returns {Promise<boolean>}
 */
async function hasCV() {
  const metadata = await getCVMetadata();
  return metadata !== null;
}

/**
 * Checks if API key is stored
 * @returns {Promise<boolean>}
 */
async function hasAPIKey() {
  const key = await getAPIKey();
  return key !== null && key.length > 0;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = {
    storeCV,
    getCV,
    getCVMetadata,
    deleteCV,
    storeAPIKey,
    getAPIKey,
    deleteAPIKey,
    hasCV,
    hasAPIKey
  };
}

