/**
 * File Parser Module
 * Handles parsing PDF and DOCX files to extract text content
 * 
 * Dependencies:
 * - PDF.js for PDF parsing (lib/pdf.min.js)
 * - Mammoth.js for DOCX parsing (lib/mammoth.browser.min.js)
 */

/**
 * Parses a PDF file and extracts text
 * @param {File} file - The PDF file to parse
 * @returns {Promise<{success: boolean, text?: string, error?: string}>}
 */
async function parsePDF(file) {
  try {
    // Check if PDF.js is loaded
    if (typeof pdfjsLib === 'undefined') {
      return {
        success: false,
        error: 'PDF.js library not loaded. Please ensure lib/pdf.min.js is included.'
      };
    }

    // Configure PDF.js worker
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Concatenate text items
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    // Clean up text
    fullText = fullText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .trim();
    
    if (!fullText || fullText.length < 50) {
      return {
        success: false,
        error: 'PDF appears to be empty or contains only images. Please use a text-based PDF.'
      };
    }
    
    console.log(`[Company Lens] Successfully parsed PDF: ${fullText.length} characters`);
    return {
      success: true,
      text: fullText
    };
  } catch (error) {
    console.error('[Company Lens] Error parsing PDF:', error);
    return {
      success: false,
      error: `Failed to parse PDF: ${error.message}`
    };
  }
}

/**
 * Parses a DOCX file and extracts text
 * @param {File} file - The DOCX file to parse
 * @returns {Promise<{success: boolean, text?: string, error?: string}>}
 */
async function parseDOCX(file) {
  try {
    // Check if Mammoth is loaded
    if (typeof mammoth === 'undefined') {
      return {
        success: false,
        error: 'Mammoth.js library not loaded. Please ensure lib/mammoth.browser.min.js is included.'
      };
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    let text = result.value;
    
    // Clean up text
    text = text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .trim();
    
    if (!text || text.length < 50) {
      return {
        success: false,
        error: 'DOCX appears to be empty or could not be parsed.'
      };
    }
    
    console.log(`[Company Lens] Successfully parsed DOCX: ${text.length} characters`);
    return {
      success: true,
      text: text
    };
  } catch (error) {
    console.error('[Company Lens] Error parsing DOCX:', error);
    return {
      success: false,
      error: `Failed to parse DOCX: ${error.message}`
    };
  }
}

/**
 * Parses a CV file (auto-detects format)
 * @param {File} file - The CV file to parse
 * @returns {Promise<{success: boolean, text?: string, error?: string}>}
 */
async function parseCV(file) {
  try {
    if (!file) {
      return {
        success: false,
        error: 'No file provided'
      };
    }

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`
      };
    }

    // Detect file type by extension
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
      return await parsePDF(file);
    } else if (fileName.endsWith('.docx')) {
      return await parseDOCX(file);
    } else {
      return {
        success: false,
        error: 'Unsupported file format. Please upload a PDF or DOCX file.'
      };
    }
  } catch (error) {
    console.error('[Company Lens] Error in parseCV:', error);
    return {
      success: false,
      error: `Failed to parse CV: ${error.message}`
    };
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment (for testing)
  module.exports = {
    parsePDF,
    parseDOCX,
    parseCV
  };
}

