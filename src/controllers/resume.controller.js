// src/controllers/resume.controller.js
const multer = require('multer');
const { Pool } = require('pg');
const { uploadBuffer } = require('../services/storage.s3');

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

    const userId = req.body.userId || (req.user && req.user.id) || 'anonymous';
    const filename = generateFilename(userId);
    const key = `resumes/${userId}/${filename}`;

    // Upload to S3
    const url = await uploadBuffer({ buffer: file.buffer, key, contentType: file.mimetype });

    // Store metadata in DB
    const insert = `INSERT INTO resumes(user_id, filename, url, size, mime) VALUES($1,$2,$3,$4,$5) RETURNING id, uploaded_at`;
    const values = [userId, filename, url, file.size, file.mimetype];
    const result = await pool.query(insert, values);

    const uploaded_at = result.rows[0].uploaded_at;

    return res.json({ success: true, filename, url, message: 'Upload successful', uploaded_at });
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
