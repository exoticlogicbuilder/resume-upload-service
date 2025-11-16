// src/controllers/resume.controller.js
const multer = require('multer');
const { uploadBuffer } = require('../services/storage.digitalocean');
const { resumeModel } = require('../models/resume.model');

function generateFilename(userId) {
  // keep original extension and create a unique name
  return `${userId}_${Date.now()}.pdf`;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value) {
  return UUID_REGEX.test(value);
}

async function uploadResume(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Defensive server-side checks (MIME + size)
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Invalid file type' });
    }

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || String(2 * 1024 * 1024), 10);
    if (file.size > maxSize) {
      return res.status(413).json({ success: false, message: 'File too large' });
    }

    const rawUserId = req.body.userId ?? (req.user && req.user.id);
    const userId = typeof rawUserId === 'string'
      ? rawUserId.trim()
      : rawUserId ? String(rawUserId) : '';

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!isValidUUID(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID format' });
    }

    const status = req.body.status || 'uploaded';
    const filename = generateFilename(userId);
    const key = `resumes/${userId}/${filename}`;

    // Upload to object storage
    const fileUrl = await uploadBuffer({ buffer: file.buffer, key, contentType: file.mimetype });

    // Persist metadata
    const uploadDate = new Date();
    const resumeRecord = await resumeModel.create({
      userId,
      filename,
      fileUrl,
      fileSize: file.size,
      fileType: file.mimetype,
      status,
      uploadDate,
    });

    return res.status(201).json({
      success: true,
      message: 'Upload successful',
      data: resumeRecord,
      id: resumeRecord.id,
      userId: resumeRecord.user_id,
      filename: resumeRecord.filename,
      fileUrl: resumeRecord.file_url,
      url: resumeRecord.file_url,
      uploaded_at: resumeRecord.upload_date,
      status: resumeRecord.status,
    });
  } catch (err) {
    // Multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File too large. Maximum size is 2MB.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message.includes('Only PDF files are allowed')) {
        return res.status(400).json({ success: false, message: 'Only PDF files are allowed.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    if (err && err.message && (err.message.includes('is required') || err.message.includes('must be'))) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Database errors
    if (err.code && err.code.startsWith('23')) {
      console.error('Database constraint error:', err);
      return res.status(400).json({ success: false, message: 'Invalid data provided.' });
    }

    // Network/storage errors
    if (err.name === 'NoSuchBucket' || err.name === 'AccessDenied') {
      console.error('Storage configuration error:', err);
      return res.status(500).json({ success: false, message: 'Storage service is not properly configured.' });
    }

    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: 'Upload failed. Please try again.', error: err.message });
  }
}

module.exports = { uploadResume };
