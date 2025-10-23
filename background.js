/**
 * Background Service Worker for Company Lens
 * Handles API calls to DeepSeek for CV comparison
 */

console.log('[Company Lens] Background service worker initialized');

/**
 * Message listener for communication with content scripts and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Company Lens] Background received message:', message.type);

  if (message.type === 'COMPARE_CV') {
    handleCompareCV(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'CHECK_API_KEY') {
    handleCheckAPIKey(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    return true; // Keep channel open for async response
  }

  return false;
});

/**
 * Handles CV comparison request
 * @param {object} data - { cvText, jobDescription, apiKey }
 * @returns {Promise<object>}
 */
async function handleCompareCV(data) {
  try {
    const { cvText, jobDescription, apiKey } = data;

    if (!cvText || !jobDescription || !apiKey) {
      return {
        success: false,
        error: 'Missing required data for comparison'
      };
    }

    console.log('[Company Lens] Making DeepSeek API request...');

    // Call DeepSeek API
    const result = await callDeepSeekAPI(cvText, jobDescription, apiKey);

    return result;
  } catch (error) {
    console.error('[Company Lens] Error in handleCompareCV:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Checks if API key is valid by making a test request
 * @param {object} data - { apiKey }
 * @returns {Promise<object>}
 */
async function handleCheckAPIKey(data) {
  try {
    const { apiKey } = data;

    if (!apiKey) {
      return {
        success: false,
        error: 'No API key provided'
      };
    }

    // Make a simple test request to validate the key
    const response = await fetch('https://api.deepseek.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      return {
        success: true,
        message: 'API key is valid'
      };
    } else {
      return {
        success: false,
        error: 'Invalid API key'
      };
    }
  } catch (error) {
    console.error('[Company Lens] Error checking API key:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calls DeepSeek API to compare CV with job description
 * @param {string} cvText - The CV text
 * @param {object} jobDescription - Job description object
 * @param {string} apiKey - DeepSeek API key
 * @returns {Promise<object>}
 */
async function callDeepSeekAPI(cvText, jobDescription, apiKey) {
  try {
    const prompt = buildComparisonPrompt(cvText, jobDescription);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career advisor and recruiter. Your task is to analyze how well a candidate\'s CV matches a job description and provide detailed, actionable feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid API response format');
    }

    const content = data.choices[0].message.content;
    
    // Try to parse JSON response
    let comparison;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      
      comparison = JSON.parse(jsonText);
    } catch (parseError) {
      // If JSON parsing fails, structure the raw text
      comparison = {
        matchScore: 50,
        summary: content,
        matchingSkills: [],
        missingSkills: [],
        detailedAnalysis: content,
        recommendations: []
      };
    }

    console.log('[Company Lens] DeepSeek API call successful');

    return {
      success: true,
      comparison: comparison
    };
  } catch (error) {
    console.error('[Company Lens] Error calling DeepSeek API:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorMessage = 'Invalid API key. Please check your DeepSeek API key.';
    } else if (error.message.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded. Please check your DeepSeek account.';
    } else if (error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your internet connection.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Builds the comparison prompt for DeepSeek
 * @param {string} cvText - The CV text
 * @param {object} jobDescription - Job description object
 * @returns {string}
 */
function buildComparisonPrompt(cvText, jobDescription) {
  const jobText = `
Job Title: ${jobDescription.title || 'N/A'}
Company: ${jobDescription.company || 'N/A'}

Job Description:
${jobDescription.description || 'N/A'}

Requirements:
${jobDescription.requirements || 'N/A'}
  `.trim();

  return `
Compare the following CV with the job description and provide a detailed analysis.

CV:
${cvText}

---

Job Description:
${jobText}

---

Please analyze the match and provide your response in the following JSON format:

{
  "matchScore": <number 0-100>,
  "summary": "<brief 2-3 sentence overview of the match>",
  "matchingSkills": ["skill1", "skill2", "..."],
  "missingSkills": ["skill1", "skill2", "..."],
  "detailedAnalysis": {
    "strengths": "<what makes this candidate a good fit>",
    "gaps": "<what's missing or could be improved>",
    "experience": "<assessment of relevant experience>",
    "education": "<assessment of educational background>"
  },
  "recommendations": [
    "<recommendation 1>",
    "<recommendation 2>",
    "..."
  ]
}

Provide specific, actionable insights. Focus on technical skills, experience levels, and qualifications mentioned in both documents.
`.trim();
}

