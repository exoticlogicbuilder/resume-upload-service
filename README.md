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

## Notes
- Requests to `/api/resumes` must include a `userId` field containing a valid UUID.
- Uses `multer.memoryStorage()` and streams buffer to S3.
- Files are uploaded with `public-read` ACL by default. Change in `src/services/storage.s3.js` if you need private storage.
- Resume metadata is stored in Postgres with the columns: `id`, `user_id`, `filename`, `file_url`, `file_size`, `file_type`, `upload_date`, and `status`.
