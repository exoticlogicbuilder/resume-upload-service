// src/services/storage.digitalocean.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const REGION = process.env.DIGITALOCEAN_REGION || 'us-east-1';
const BUCKET = process.env.DIGITALOCEAN_BUCKET;
const DIGITALOCEAN_ENDPOINT = process.env.DIGITALOCEAN_ENDPOINT;

if (!BUCKET || !DIGITALOCEAN_ENDPOINT) {
  throw new Error('Missing DIGITALOCEAN_BUCKET or DIGITALOCEAN_ENDPOINT environment variables');
}

// Configure for DigitalOcean Spaces
const s3Config = {
  region: REGION,
  endpoint: DIGITALOCEAN_ENDPOINT,
  forcePathStyle: true, // Required for DigitalOcean Spaces
};

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

  // DigitalOcean Spaces URL format
  const url = `https://${BUCKET}.${DIGITALOCEAN_ENDPOINT}/${encodeURIComponent(key)}`;
  
  return url;
}

module.exports = { uploadBuffer };
