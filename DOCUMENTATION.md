# Resume Upload Service - Documentation
 
## Overview
 
The Resume Upload Service is a Node.js microservice designed to handle PDF resume uploads with secure storage, metadata persistence, and text extraction capabilities. The service integrates with DigitalOcean Spaces (S3-compatible storage) and PostgreSQL for data persistence.
 
## Features Implemented

### 1. PDF Upload & Storage
- **File Validation**: Accepts only PDF files with maximum size of 2MB (configurable)
- **Memory Storage**: Uses multer memory storage for efficient file handling
- **Cloud Storage**: Uploads files to DigitalOcean Spaces with private ACL
- **Unique Naming**: Generates unique filenames using user ID and timestamp
 
### 2. Text Extraction
- **PDF Parsing**: Extracts text content from uploaded PDF files using pdf-parse library
- **Content Cleaning**: Normalizes whitespace, line breaks, and formatting
- **Error Handling**: Handles encrypted PDFs, corrupted files, and image-only PDFs gracefully
- **Metadata Storage**: Stores extracted text in database for search/indexing
 
### 3. Secure Download System
- **Signed URLs**: Generates time-limited signed URLs for secure file access (1-hour expiration)
- **Private Storage**: Files stored with private ACL, accessible only via signed URLs
- **User Authorization**: Ensures users can only access their own files
 
### 4. Database Management
- **PostgreSQL Integration**: Full CRUD operations for resume metadata
- **UUID Primary Keys**: Uses UUIDs for resume and user identification
- **Indexing**: Optimized queries with user_id indexing
- **Audit Trail**: Automatic created_at and updated_at timestamps
 
### 5. Web Dashboard
- **React-based UI**: Modern responsive dashboard for file management
- **Real-time Updates**: Dynamic file listing and upload status
- **User Experience**: Drag-and-drop upload, progress indicators, error handling
 
## Technical Architecture & Logic
 
### File Upload Flow
```
1. Client sends multipart/form-data to POST /api/resumes
2. Multer middleware validates file type and size in memory
3. Controller extracts user ID from multiple sources (headers, query, body)
4. PDF text extraction attempted (non-blocking)
5. File uploaded to DigitalOcean Spaces with private ACL
6. Metadata stored in PostgreSQL with extracted text
7. Response includes file details and signed download URL
```
 
### Security Logic
- **User ID Resolution**: Checks headers (X-User-ID), query parameters, and request body
- **UUID Validation**: Strict UUID format validation for user and resume IDs
- **Authorization**: Users can only access their own resumes
- **Signed URLs**: Temporary access tokens prevent direct URL sharing
 
### Error Handling Strategy
- **Multer Errors**: File size limits, invalid MIME types
- **Storage Errors**: Bucket configuration, network issues
- **Database Errors**: Constraint violations, connection issues
- **PDF Extraction**: Graceful degradation for unparseable files
 
## API Endpoints
 
### 1. Health Check
**GET /health**
 
**Response:**
```json
{
  "status": "ok"
}
```
 
**Curl Test:**
```bash
curl -X GET http://localhost:3000/health
# Expected: {"status":"ok"}
```
 
### 2. Upload Resume
**POST /api/resumes**
 
**Request:**
- Content-Type: multipart/form-data
- Fields:
  - `file`: PDF file (required)
  - `userId`: User UUID (required)
  - `status`: Upload status (optional, defaults to 'uploaded')
 
**Response:**
```json
{
  "success": true,
  "message": "Upload successful",
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "filename": "user-uuid_timestamp.pdf",
    "fileSize": 1234567,
    "fileType": "application/pdf",
    "uploadDate": "2024-01-01T12:00:00.000Z",
    "status": "uploaded",
    "extractedText": "Resume content...",
    "downloadUrl": "https://signed-url-for-1-hour",
    "fileUrl": "https://bucket.endpoint/path",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "id": "uuid",
  "userId": "user-uuid",
  "filename": "user-uuid_timestamp.pdf",
  "fileUrl": "https://bucket.endpoint/path",
  "url": "https://bucket.endpoint/path",
  "uploaded_at": "2024-01-01T12:00:00.000Z",
  "status": "uploaded",
  "downloadUrl": "https://signed-url-for-1-hour",
  "extractedText": "Resume content..."
}
```
 
**Curl Tests:**
```bash
# Valid upload
curl -X POST http://localhost:3000/api/resumes \
  -F "file=@resume.pdf" \
  -F "userId=550e8400-e29b-41d4-a716-446655440000"
# Expected: 201 with full response object
# Missing file
curl -X POST http://localhost:3000/api/resumes \
  -F "userId=550e8400-e29b-41d4-a716-446655440000"
# Expected: 400 {"success":false,"message":"No file uploaded"}
# Invalid file type
curl -X POST http://localhost:3000/api/resumes \
  -F "file=@image.jpg" \
  -F "userId=550e8400-e29b-41d4-a716-446655440000"
# Expected: 400 {"success":false,"message":"Invalid file type"}
# Missing user ID
curl -X POST http://localhost:3000/api/resumes \
  -F "file=@resume.pdf"
# Expected: 400 {"success":false,"message":"User ID is required"}
# Invalid UUID format
curl -X POST http://localhost:3000/api/resumes \
  -F "file=@resume.pdf" \
  -F "userId=invalid-uuid"
# Expected: 400 {"success":false,"message":"Invalid User ID format"}
```
 
### 3. List User Resumes
**GET /api/resumes**
 
**Parameters:**
- `userId` (query): User UUID
- OR `X-User-ID` (header): User UUID
 
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "filename": "resume.pdf",
      "fileSize": 1234567,
      "fileType": "application/pdf",
      "uploadDate": "2024-01-01T12:00:00.000Z",
      "status": "uploaded",
      "extractedText": "Resume content...",
      "downloadUrl": "https://signed-url-for-1-hour",
      "fileUrl": "https://bucket.endpoint/path",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```
 
**Curl Tests:**
```bash
# Valid request with query parameter
curl -X GET "http://localhost:3000/api/resumes?userId=550e8400-e29b-41d4-a716-446655440000"
# Expected: 200 with array of resume objects
# Valid request with header
curl -X GET http://localhost:3000/api/resumes \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000"
# Expected: 200 with array of resume objects
# Missing user ID
curl -X GET http://localhost:3000/api/resumes
# Expected: 400 {"success":false,"message":"User ID is required"}
# Invalid UUID
curl -X GET "http://localhost:3000/api/resumes?userId=invalid-uuid"
# Expected: 400 {"success":false,"message":"Invalid User ID format"}
```
 
### 4. Get Specific Resume
**GET /api/resumes/:id**
 
**Parameters:**
- `id` (path): Resume UUID
- `userId` (query): User UUID for authorization
- OR `X-User-ID` (header): User UUID for authorization
 
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "filename": "resume.pdf",
    "fileSize": 1234567,
    "fileType": "application/pdf",
    "uploadDate": "2024-01-01T12:00:00.000Z",
    "status": "uploaded",
    "extractedText": "Resume content...",
    "downloadUrl": "https://signed-url-for-1-hour",
    "fileUrl": "https://bucket.endpoint/path",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```
 
**Curl Tests:**
```bash
# Valid request
curl -X GET "http://localhost:3000/api/resumes/resume-uuid?userId=550e8400-e29b-41d4-a716-446655440000"
# Expected: 200 with resume object
# Non-existent resume
curl -X GET "http://localhost:3000/api/resumes/non-existent-uuid?userId=550e8400-e29b-41d4-a716-446655440000"
# Expected: 404 {"success":false,"message":"Resume not found"}
# Accessing another user's resume
curl -X GET "http://localhost:3000/api/resumes/other-user-resume-uuid?userId=550e8400-e29b-41d4-a716-446655440000"
# Expected: 404 {"success":false,"message":"Resume not found"}
# Invalid resume ID
curl -X GET "http://localhost:3000/api/resumes/invalid-uuid?userId=550e8400-e29b-41d4-a716-446655440000"
# Expected: 400 {"success":false,"message":"Invalid resume ID"}
```
 
## Testing Details
 
### 1. Database Model Tests (`tests/resume.model.test.js`)
 
**Test Coverage:**
- **Create Operation**: Validates metadata storage and return values
- **Default Values**: Ensures default status ('uploaded') and null extracted text
- **Input Validation**: Tests file size validation and required field checks
- **Query Operations**: Tests findByUserId and findById methods
- **Error Handling**: Validates constraint violations and missing data
 
**Test Cases Executed:**
```javascript
// 1. Successful creation with all fields
✓ ResumeModel#create stores metadata and returns the persisted row
// 2. Default value application
✓ ResumeModel#create applies default status when none is supplied
// 3. File size validation
✓ ResumeModel#create validates positive file size
// 4. Required field validation
✓ ResumeModel#create throws when required fields are missing
// 5. User-based querying
✓ ResumeModel#findByUserId queries resumes for the specified user
// 6. Individual record retrieval
✓ ResumeModel#findById returns the matching resume or null
```
 
### 2. PDF Extraction Tests (`tests/pdf-extration.test.js`)
 
**Test Coverage:**
- **Text Cleaning**: Normalizes whitespace and line breaks
- **Input Validation**: Handles invalid buffers and edge cases
- **Error Handling**: Processes corrupted PDFs and invalid formats
- **Content Processing**: Tests text extraction from valid PDFs
 
**Test Cases Executed:**
```javascript
// 1. Text cleaning functionality
✓ cleanExtractedText removes extra whitespace
✓ cleanExtractedText handles empty string
✓ cleanExtractedText handles null
✓ cleanExtractedText normalizes line breaks
// 2. PDF extraction validation
✓ extractTextFromPDF handles invalid buffer
✓ extractTextFromPDF handles non-buffer input
✓ extractTextFromPDF handles invalid PDF content
```
 
### 3. Integration Testing Strategy
 
**Manual Testing Performed:**
- **End-to-End Upload**: Complete flow from file upload to database storage
- **Signed URL Generation**: Verified URL creation and expiration
- **Authorization Testing**: Confirmed user isolation and access controls
- **Error Scenarios**: Tested various failure modes and error responses
- **File Size Limits**: Verified 2MB limit enforcement
- **MIME Type Validation**: Confirmed PDF-only upload restriction
 
**Load Testing Considerations:**
- Memory usage with concurrent uploads
- Database connection pooling under load
- DigitalOcean Spaces API rate limits
- PDF extraction performance with large files
 
## Database Schema
 
### Resumes Table Structure
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(512) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  file_type VARCHAR(100) NOT NULL,
  upload_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
  extracted_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
 
**Indexes:**
- `idx_resumes_user_id` on user_id for optimized user-based queries
 
**Triggers:**
- `set_resumes_updated_at`: Automatically updates updated_at timestamp
 
## Configuration
 
### Environment Variables
```bash
PORT=3000                                    # Server port
DATABASE_URL=postgresql://user:pass@localhost:5432/resumes  # PostgreSQL connection
DIGITALOCEAN_REGION=us-east-1               # Storage region
DIGITALOCEAN_BUCKET=your-spaces-bucket-name  # Storage bucket name
DIGITALOCEAN_ENDPOINT=nyc3.digitaloceanspaces.com  # Storage endpoint
MAX_FILE_SIZE=2097152                        # Max file size in bytes (2MB)
PGSSLMODE=disable                            # PostgreSQL SSL mode
```
 
## Security Considerations
 
### File Access Control
- Files stored with `private` ACL in DigitalOcean Spaces
- Access only through signed URLs with 1-hour expiration
- User authorization enforced at API level
- UUID-based identification prevents enumeration attacks
 
### Input Validation
- Strict UUID format validation for user and resume IDs
- File type validation (PDF only)
- File size limits enforced at multiple levels
- SQL injection prevention through parameterized queries
 
### Error Handling
- Generic error messages for security-sensitive information
- Detailed logging for debugging without exposing internals
- Graceful degradation for PDF extraction failures
 
## Performance Optimizations
 
### Memory Management
- In-memory file processing with multer
- Streaming uploads to reduce memory footprint
- Efficient PDF parsing with cleanup procedures
 
### Database Optimization
- Connection pooling with pg
- Indexed queries for user-based operations
- Efficient pagination support for large datasets
 
### Storage Optimization
- Direct uploads to DigitalOcean Spaces
- Signed URL generation to proxy downloads
- Efficient object key structure for organization
 
## Deployment Notes
 
### Dependencies
- Node.js runtime
- PostgreSQL database with `pgcrypto` extension
- DigitalOcean Spaces (or S3-compatible storage)
- Environment configuration
 
### Monitoring
- Health check endpoint at `/health`
- Comprehensive error logging
- Performance metrics through application logs