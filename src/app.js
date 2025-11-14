// src/app.js
require('dotenv').config();
const express = require('express');
const upload = require('./config/multer');
const { uploadResume } = require('./controllers/resume.controller');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Upload route
app.post('/api/resumes', upload.single('file'), uploadResume);

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

module.exports = app;
