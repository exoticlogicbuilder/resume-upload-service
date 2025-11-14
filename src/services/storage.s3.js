// src/services/storage.s3.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.S3_BUCKET;

if (!REGION || !BUCKET) {
  throw new Error('Missing AWS_REGION or S3_BUCKET environment variables');
}

const s3 = new S3Client({ region: REGION });

async function uploadBuffer({ buffer, key, contentType }) {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'public-read', // change if you want private objects
  };

  await s3.send(new PutObjectCommand(params));

  // Public URL format for AWS S3
  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(key)}`;
  return url;
}

module.exports = { uploadBuffer };
