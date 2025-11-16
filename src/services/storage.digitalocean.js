// src/services/storage.digitalocean.js
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const REGION = process.env.DIGITALOCEAN_REGION || 'us-east-1';
const BUCKET = process.env.DIGITALOCEAN_BUCKET;
const RAW_ENDPOINT = process.env.DIGITALOCEAN_ENDPOINT;

if (!BUCKET || !RAW_ENDPOINT) {
  throw new Error('Missing DIGITALOCEAN_BUCKET or DIGITALOCEAN_ENDPOINT environment variables');
}

const endpointHasProtocol = /^https?:\/\//i.test(RAW_ENDPOINT);
const endpointWithoutProtocol = RAW_ENDPOINT.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
const endpointForClient = endpointHasProtocol
  ? `${RAW_ENDPOINT.split('://')[0]}://${endpointWithoutProtocol}`
  : `https://${endpointWithoutProtocol}`;
const endpointHost = endpointWithoutProtocol;

// Configure for DigitalOcean Spaces
const s3Config = {
  region: REGION,
  endpoint: endpointForClient,
  forcePathStyle: true, // Required for DigitalOcean Spaces
};

const s3 = new S3Client(s3Config);

function buildPublicUrl(key) {
  const encodedKey = encodeURIComponent(key);
  return `https://${BUCKET}.${endpointHost}/${encodedKey}`;
}

function extractObjectKey(fileUrl) {
  if (!fileUrl) return null;
  const expectedPrefix = `https://${BUCKET}.${endpointHost}/`;
  if (!fileUrl.startsWith(expectedPrefix)) {
    return null;
  }

  const encodedKey = fileUrl.slice(expectedPrefix.length);

  try {
    return decodeURIComponent(encodedKey);
  } catch (err) {
    console.error('Failed to decode object key from URL:', err);
    return null;
  }
}

async function uploadBuffer({ buffer, key, contentType }) {
  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: 'private',
  };

  await s3.send(new PutObjectCommand(params));

  return buildPublicUrl(key);
}

async function getSignedDownloadUrl({ key, expiresIn = 3600 }) {
  if (!key) {
    throw new Error('Object key is required to generate a signed URL');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

module.exports = {
  uploadBuffer,
  getSignedDownloadUrl,
  extractObjectKey,
};
