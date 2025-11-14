// src/controllers/resume.controller.js
const multer = require('multer');
const { Pool } = require('pg');
const { uploadBuffer } = require('../services/storage.s3');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUserId(raw) {
  if (!raw) return '';
  return String(raw).trim();
}

function generateFilename(userId) {
  return `${userId}_${Date.now()}.pdf`;
}

async function uploadResume(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = normalizeUserId(req.body.userId || (req.user && req.user.id));
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    if (!uuidPattern.test(userId)) {
      return res.status(400).json({ success: false, message: 'userId must be a valid UUID' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Invalid file type. Only PDF files are allowed.' });
    }

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || String(2 * 1024 * 1024), 10);
    if (file.size > maxSize) {
      return res.status(413).json({ success: false, message: 'File too large' });
    }

    const filename = generateFilename(userId);
    const key = `resumes/${userId}/${filename}`;

    const fileUrl = await uploadBuffer({ buffer: file.buffer, key, contentType: file.mimetype });

    const statusValue = 'uploaded';
    const insert = `
      INSERT INTO resumes (user_id, filename, file_url, file_size, file_type, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, upload_date, status
    `;
    const values = [userId, filename, fileUrl, file.size, file.mimetype, statusValue];
    const result = await pool.query(insert, values);
    const { id, upload_date: uploadDate, status } = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Upload successful',
      id,
      filename,
      fileUrl,
      fileSize: file.size,
      fileType: file.mimetype,
      status,
      uploadDate,
    });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File too large' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, message: 'Invalid file type. Only PDF files are allowed.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
}

module.exports = { uploadResume };
