# Resume Upload Service

Simple microservice to accept PDF resume uploads (max 2MB), upload to DigitalOcean Spaces, and store metadata in Postgres.

## Quickstart

1. Copy `.env.example` to `.env` and set your DigitalOcean Spaces credentials.
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

Required DigitalOcean Spaces environment variables:
- `DIGITALOCEAN_REGION`: Your Spaces region (e.g., `us-east-1`)
- `DIGITALOCEAN_BUCKET`: Your Spaces bucket name
- `DIGITALOCEAN_ENDPOINT`: Your Spaces endpoint (e.g., `nyc3.digitaloceanspaces.com`)

## Notes
- Uses `multer.memoryStorage()` and streams buffer to DigitalOcean Spaces.
- Files are uploaded with `public-read` ACL by default. Change in `src/services/storage.digitalocean.js` if you need private storage.
