// src/services/storage.s3.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;
const DIGITALOCEAN_ENDPOINT = process.env.DIGITALOCEAN_ENDPOINT;

if (!REGION || !BUCKET) {
  throw new Error('Missing AWS_REGION or S3_BUCKET environment variables');
}

// Configure for DigitalOcean Spaces
const s3Config = {
  region: REGION,
};

// Add DigitalOcean endpoint if provided
if (DIGITALOCEAN_ENDPOINT) {
  s3Config.endpoint = DIGITALOCEAN_ENDPOINT;
  s3Config.forcePathStyle = true; // Required for DigitalOcean Spaces
}

const s3 = new S3Client(s3Config);

async function uploadBuffer({ buffer, key, contentType }) {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read', // change if you want private objects
  };

  await s3.send(new PutObjectCommand(params));

  // Generate URL based on whether using DigitalOcean Spaces or AWS S3
  let url;
  if (DIGITALOCEAN_ENDPOINT) {
    // DigitalOcean Spaces URL format
    url = `https://${BUCKET}.${DIGITALOCEAN_ENDPOINT}/${encodeURIComponent(key)}`;
  } else {
    // AWS S3 URL format
    url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(key)}`;
  }
  
  return url;
}

module.exports = { uploadBuffer };
