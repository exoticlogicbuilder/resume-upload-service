// src/services/pdf-extraction.service.js
const pdfParse = require('pdf-parse');

function cleanExtractedText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    .trim();
}

async function extractTextFromPDF(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return {
      success: false,
      text: '',
      error: 'Invalid buffer provided for PDF extraction',
      errorType: 'INVALID_BUFFER',
    };
  }

  try {
    const data = await pdfParse(buffer, {
      max: 0,
      version: 'default',
    });

    if (!data || !data.text) {
      return {
        success: true,
        text: '',
        numPages: data?.numpages || 0,
        info: data?.info || {},
        metadata: data?.metadata || null,
      };
    }

    const cleanedText = cleanExtractedText(data.text);

    return {
      success: true,
      text: cleanedText,
      numPages: data.numpages || 0,
      info: data.info || {},
      metadata: data.metadata || null,
    };
  } catch (error) {
    console.error('PDF extraction error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    if (error.message && error.message.includes('Invalid PDF')) {
      return {
        success: false,
        text: '',
        error: 'Invalid or corrupted PDF file',
        errorType: 'INVALID_PDF',
      };
    }

    if (error.message && (error.message.includes('encrypted') || error.message.includes('password'))) {
      return {
        success: false,
        text: '',
        error: 'PDF is password-protected or encrypted',
        errorType: 'ENCRYPTED_PDF',
      };
    }

    if (error.message && error.message.includes('no text')) {
      return {
        success: false,
        text: '',
        error: 'PDF contains no extractable text (possibly scanned images)',
        errorType: 'NO_TEXT_CONTENT',
      };
    }

    return {
      success: false,
      text: '',
      error: error.message || 'Unknown PDF extraction error',
      errorType: 'EXTRACTION_ERROR',
    };
  }
}

module.exports = {
  extractTextFromPDF,
  cleanExtractedText,
};
