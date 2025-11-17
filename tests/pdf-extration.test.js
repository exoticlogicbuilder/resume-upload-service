const { test, describe } = require('node:test');
const assert = require('node:assert');
const { extractTextFromPDF, cleanExtractedText } = require('../src/services/pdf-extraction.service');

describe('PDF Extraction Service', () => {
  test('cleanExtractedText removes extra whitespace', () => {
    const input = '  Hello    World  \n\n\n  Test  ';
    const result = cleanExtractedText(input);
    assert.strictEqual(result, 'Hello World\n\nTest');
  });

  test('cleanExtractedText handles empty string', () => {
    const result = cleanExtractedText('');
    assert.strictEqual(result, '');
  });

  test('cleanExtractedText handles null', () => {
    const result = cleanExtractedText(null);
    assert.strictEqual(result, '');
  });

  test('cleanExtractedText normalizes line breaks', () => {
    const input = 'Line1\r\nLine2\rLine3\nLine4';
    const result = cleanExtractedText(input);
    assert.strictEqual(result, 'Line1\nLine2\nLine3\nLine4');
  });

  test('extractTextFromPDF handles invalid buffer', async () => {
    const result = await extractTextFromPDF(null);
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  test('extractTextFromPDF handles non-buffer input', async () => {
    const result = await extractTextFromPDF('not a buffer');
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
  });

  test('extractTextFromPDF handles invalid PDF content', async () => {
    const invalidBuffer = Buffer.from('This is not a PDF file');
    const result = await extractTextFromPDF(invalidBuffer);
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
    assert.ok(result.errorType);
  });
});