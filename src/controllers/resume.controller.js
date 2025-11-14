// src/controllers/resume.controller.js
const multer = require('multer');
const { Pool } = require('pg');
const { uploadBuffer } = require('../services/storage.s3');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function generateFilename(userId) {
  // keep .pdf extension and create a unique name
  return `${userId}_${Date.now()}.pdf`;
}

async function uploadResume(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Defensive server-side checks (MIME + size)
    if (file.mimetype !== 'application/pdf') return res.status(400).json({ success: false, message: 'Invalid file type' });

    const maxSize = parseInt(process.env.MAX_FILE_SIZE || String(2 * 1024 * 1024), 10);
    if (file.size > maxSize) return res.status(413).json({ success: false, message: 'File too large' });

    const providedUserId = req.body.userId ?? (req.user && req.user.id);
    const userId = typeof providedUserId === 'string' ? providedUserId.trim() : providedUserId ? String(providedUserId) : '';
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    if (!UUID_REGEX.test(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const filename = generateFilename(userId);
    const key = `resumes/${userId}/${filename}`;

    // Upload to S3
    const fileUrl = await uploadBuffer({ buffer: file.buffer, key, contentType: file.mimetype });

    // Store metadata in DB
    const insert = `INSERT INTO resumes(user_id, filename, file_url, file_size, file_type) VALUES($1,$2,$3,$4,$5) RETURNING id, upload_date, status`;
    const values = [userId, filename, fileUrl, file.size, file.mimetype];
    const result = await pool.query(insert, values);

    const { id, upload_date, status } = result.rows[0];

    return res.json({ success: true, id, filename, url: fileUrl, status, message: 'Upload successful', upload_date });
  } catch (err) {
    // Multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File too large' });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: 'Upload failed', error: err.message });
  }
}

module.exports = { uploadResume };
