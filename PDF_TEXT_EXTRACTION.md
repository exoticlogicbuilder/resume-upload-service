# PDF Text Extraction Feature

## Overview
This document describes the PDF text extraction feature that has been implemented in the resume upload service.

## Implementation Details

### 1. Dependencies
- **pdf-parse** (v2.4.5): Node.js library for extracting text from PDF files

### 2. Architecture

Following microservice architecture principles, the implementation is organized into:

#### Service Layer
- **File**: `src/services/pdf-extraction.service.js`
- **Functions**:
  - `extractTextFromPDF(buffer)`: Extracts text from a PDF buffer
  - `cleanExtractedText(text)`: Cleans and normalizes extracted text

#### Controller Layer
- **File**: `src/controllers/resume.controller.js`
- **Changes**: 
  - Integrated PDF text extraction in the `uploadResume` function
  - Extraction happens during upload, before storage
  - Errors are logged but don't block the upload process

#### Model Layer
- **File**: `src/models/resume.model.js`
- **Changes**:
  - Added `extractedText` parameter to the `create` method
  - Updated SELECT queries to include `extracted_text` field

#### Database Layer
- **File**: `db/migration.sql`
- **Changes**: Added `extracted_text TEXT` column to the resumes table

### 3. Features

#### Text Extraction
- Extracts text content from uploaded PDF files using the pdf-parse library
- Processes the PDF buffer in-memory (no file system writes)
- Returns structured information including:
  - Extracted text content
  - Number of pages
  - PDF metadata
  - Success/error status

#### Text Cleaning
The `cleanExtractedText` function applies the following transformations:
1. Normalizes line endings (converts \r\n and \r to \n)
2. Collapses 3+ consecutive newlines to 2 (preserves paragraph breaks)
3. Collapses multiple spaces/tabs to single spaces
4. Trims leading/trailing whitespace from each line
5. Trims the entire text

#### Error Handling
Gracefully handles various PDF issues:
- **Invalid/Corrupted PDFs**: Detects and logs invalid PDF format
- **Encrypted PDFs**: Identifies password-protected files
- **Scanned Images**: Detects PDFs with no extractable text
- **Generic Errors**: Catches and logs any other extraction errors

All extraction errors are logged but **do not block the upload**. The file is still uploaded and stored, with `extracted_text` set to null.

### 4. API Response

The upload endpoint now returns extracted text in the response:

```json
{
  "success": true,
  "message": "Upload successful",
  "data": {
    "id": "...",
    "userId": "...",
    "filename": "resume.pdf",
    "extractedText": "Extracted text content here...",
    ...
  },
  "extractedText": "Extracted text content here...",
  "textExtractionWarning": "Optional warning message if extraction failed"
}
```

### 5. Logging

The implementation includes comprehensive logging:

**Success logs**:
```javascript
console.log('PDF text extraction successful:', {
  userId,
  filename,
  textLength: extractedText?.length || 0,
  numPages: extractionResult.numPages,
});
```

**Warning logs**:
```javascript
console.warn('PDF text extraction failed:', {
  userId,
  filename,
  error: extractionResult.error,
  errorType: extractionResult.errorType,
});
```

**Error logs**:
```javascript
console.error('PDF text extraction error:', {
  userId,
  filename,
  error: err.message,
  stack: err.stack,
});
```

### 6. Database Schema

The `extracted_text` column:
- **Type**: TEXT (unlimited length)
- **Nullable**: Yes (allows null when extraction fails)
- **Returned**: In all resume queries (list, get by ID)

## Testing

### Unit Tests
Created comprehensive unit tests in `tests/pdf-extraction.test.js`:
- Text cleaning functionality
- Error handling for invalid inputs
- Invalid PDF detection

### Manual Testing
Use the provided HTML client (`client/index.html`) to:
1. Upload valid PDF resumes
2. Verify extracted text appears in the response
3. Test with various PDF formats (text-based, scanned, encrypted)

## Migration

### New Installation
Run the main migration:
```bash
psql -U your_user -d your_database -f db/migration.sql
```

### Existing Installation
If you already have a resumes table:
```bash
psql -U your_user -d your_database -f db/add-extracted-text-column.sql
```

## Performance Considerations

- Text extraction is performed synchronously during upload
- Processing time depends on PDF size and complexity
- Extraction is done in-memory (no disk I/O)
- Failed extractions don't impact upload success

## Future Enhancements

Potential improvements:
1. Async/background processing for large PDFs
2. OCR integration for scanned documents
3. Text analysis and keyword extraction
4. Language detection
5. Resume parsing (skills, experience, education)
