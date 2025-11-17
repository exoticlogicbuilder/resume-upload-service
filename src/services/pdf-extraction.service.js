// src/services/pdf-extraction.service.js
const pdfParseModule = require('pdf-parse');

const PDFParseConstructor = pdfParseModule?.PDFParse
  || pdfParseModule?.default?.PDFParse
  || pdfParseModule?.default;

if (typeof PDFParseConstructor !== 'function') {
  throw new Error('Failed to load PDFParse constructor from pdf-parse. Ensure v2+ is installed.');
}

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

  let parser;
  try {
    parser = new PDFParseConstructor({ data: buffer });
    const data = await parser.getText();

    if (!data || !data.text) {
      return {
        success: true,
        text: '',
        numPages: data?.total || data?.pages?.length || 0,
        info: data?.info || {},
        metadata: data?.metadata || null,
      };
    }

    const cleanedText = cleanExtractedText(data.text);

    return {
      success: true,
      text: cleanedText,
      numPages: data.total || data.pages?.length || 0,
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
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch (destroyError) {
        console.warn('Failed to destroy PDF parser instance:', destroyError);
      }
    }
  }
}

module.exports = {
  extractTextFromPDF,
  cleanExtractedText,
};