// src/app.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const upload = require('./config/multer');
const { uploadResume } = require('./controllers/resume.controller');

const app = express();

// Enable CORS for all routes
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Default route to serve the upload form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

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
