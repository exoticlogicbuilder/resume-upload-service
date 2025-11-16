# Resume Upload Service

Simple microservice to accept PDF resume uploads (max 2MB), upload to S3, and store metadata in Postgres.

## Quickstart

1. Copy `.env.example` to `.env` and set values.
2. Install dependencies:
   ```
   npm install
   ```
3. Create the `resumes` table in your Postgres DB (see migration).
4. Start the server:
   ```
   npm run start
   ```
5. Open `client/index.html` in a browser (or serve it) and test uploading a PDF to `http://localhost:3000/api/resumes`.

## Testing
Run the unit tests with:
```
npm test
```
 
## Database Schema
The service persists uploads to the `resumes` table with the following columns:
- `id` (UUID primary key)
- `user_id` (UUID foreign key to the `users` table)
- `filename`
- `file_url`
- `file_size`
- `file_type`
- `upload_date`
- `status`
- `created_at`
- `updated_at`
 
## Notes
- Uses `multer.memoryStorage()` and streams buffer to S3.
- Files are uploaded with `public-read` ACL by default. Change in `src/services/storage.s3.js` if you need private storage.


# Resume Upload Service

Node.js microservice for uploading PDF resumes (max 2MB) to DigitalOcean Spaces with PostgreSQL metadata storage and secure download functionality.

## Features

- Upload PDF resumes to DigitalOcean Spaces (S3-compatible storage)
- Store resume metadata in PostgreSQL
- List all resumes for a user
- Retrieve specific resume details
- Generate secure signed URLs for downloading (1-hour expiration)
- React-based dashboard for managing resumes

## Quickstart

1. Copy `.env.example` to `.env` and set values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create the `resumes` table in your Postgres DB:
   ```bash
   psql -U your_user -d your_database -f db/migration.sql
   ```
4. Start the server:
   ```bash
   npm run start
   ```
5. Open `http://localhost:3000` in a browser to access the dashboard.

## API Endpoints

### POST /api/resumes
Upload a PDF resume (max 2MB).

**Request:**
- Body: `multipart/form-data`
  - `file`: PDF file
  - `userId`: User UUID

**Response:** Resume metadata with download URL

### GET /api/resumes
List all resumes for a user.

**Query Parameters:**
- `userId`: User UUID

**Headers (alternative):**
- `X-User-Id`: User UUID

**Response:** Array of resume objects with signed download URLs

### GET /api/resumes/:id
Get a specific resume by ID.

**Query Parameters:**
- `userId`: User UUID (for authorization)

**Headers (alternative):**
- `X-User-Id`: User UUID

**Response:** Resume object with signed download URL (expires in 1 hour)

### GET /health
Health check endpoint.

## Security

- Files are stored as **private** objects in DigitalOcean Spaces
- Download access is controlled via signed URLs that expire after 1 hour
- User authentication required for all resume operations
- Resume access is restricted to the owning user

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

## Notes

- Uses `multer.memoryStorage()` and streams buffer to DigitalOcean Spaces
- Files are uploaded with `private` ACL for secure access control
- Signed URLs are generated on-demand for downloads using AWS SDK v3
- Frontend uses React (loaded via CDN) for dashboard functionality