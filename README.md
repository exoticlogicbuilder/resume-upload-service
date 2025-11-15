# Resume Upload Service

Simple microservice to accept PDF resume uploads (max 2MB), upload to DigitalOcean Spaces/S3, and store metadata in Postgres.

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

## Configuration

- For **DigitalOcean Spaces**: Set `DIGITALOCEAN_ENDPOINT` (e.g., `nyc3.digitaloceanspaces.com`)
- For **AWS S3**: Leave `DIGITALOCEAN_ENDPOINT` unset
- The service automatically detects which provider to use based on the endpoint configuration

## Notes
- Uses `multer.memoryStorage()` and streams buffer to cloud storage.
- Files are uploaded with `public-read` ACL by default. Change in `src/services/storage.s3.js` if you need private storage.
