// src/controllers/resume.controller.js
const multer = require('multer');
const {
  uploadBuffer,
  getSignedDownloadUrl,
  extractObjectKey,
} = require('../services/storage.digitalocean');
const { resumeModel } = require('../models/resume.model');
const { extractTextFromPDF } = require('../services/pdf-extraction.service');

function generateFilename(userId) {
  // keep original extension and create a unique name
  return `${userId}_${Date.now()}.pdf`;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value) {
  return UUID_REGEX.test(value);
}

function resolveUserId(req, { includeBody = false } = {}) {
  if (!req) return '';

  const candidateSources = [
    req.user && req.user.id,
    req.headers && (req.headers['x-user-id'] ?? req.headers['x-userid']),
    req.query && (req.query.userId ?? req.query.user_id),
  ];

  if (includeBody && req.body) {
    candidateSources.push(req.body.userId, req.body.user_id);
  }

  for (const candidate of candidateSources) {
    if (candidate === undefined || candidate === null) continue;
    const normalized = typeof candidate === 'string' ? candidate.trim() : String(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

async function buildResumeResponse(record) {
  if (!record) {
    return null;
  }

  const fileUrl = record.file_url ?? record.fileUrl ?? null;
  const objectKey = extractObjectKey(fileUrl);

  let downloadUrl = null;
  if (objectKey) {
    downloadUrl = await getSignedDownloadUrl({ key: objectKey, expiresIn: 3600 });
  }

  const response = {
    id: record.id,
    userId: record.user_id ?? record.userId ?? null,
    filename: record.filename,
    fileSize: record.file_size ?? record.fileSize ?? null,
    fileType: record.file_type ?? record.fileType ?? null,
    uploadDate: record.upload_date ?? record.uploadDate ?? null,
    status: record.status ?? null,
    extractedText: record.extracted_text ?? record.extractedText ?? null,
    downloadUrl,
    fileUrl,
    createdAt: record.created_at ?? record.createdAt ?? null,
    updatedAt: record.updated_at ?? record.updatedAt ?? null,
  };

  // Include legacy snake_case keys for backwards compatibility
  response.file_url = record.file_url ?? record.fileUrl ?? null;
  response.upload_date = record.upload_date ?? record.uploadDate ?? null;
  response.extracted_text = record.extracted_text ?? record.extractedText ?? null;
  response.created_at = record.created_at ?? record.createdAt ?? null;
  response.updated_at = record.updated_at ?? record.updatedAt ?? null;

  return response;
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

    const userId = resolveUserId(req, { includeBody: true });

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!isValidUUID(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID format' });
    }

    const status = req.body?.status || 'uploaded';
    const filename = generateFilename(userId);
    const key = `resumes/${userId}/${filename}`;

    // Extract text from PDF
    let extractedText = null;
    let extractionError = null;
    try {
      const extractionResult = await extractTextFromPDF(file.buffer);
      if (extractionResult.success) {
        extractedText = extractionResult.text || null;
        console.log('PDF text extraction successful:', {
          userId,
          filename,
          textLength: extractedText?.length || 0,
          numPages: extractionResult.numPages,
        });
      } else {
        extractionError = extractionResult.error;
        console.warn('PDF text extraction failed:', {
          userId,
          filename,
          error: extractionResult.error,
          errorType: extractionResult.errorType,
        });
      }
    } catch (err) {
      extractionError = err.message;
      console.error('PDF text extraction error:', {
        userId,
        filename,
        error: err.message,
        stack: err.stack,
      });
    }

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
      extractedText,
    });

    const payload = await buildResumeResponse(resumeRecord);

    const responseData = {
      success: true,
      message: 'Upload successful',
      data: payload,
      id: payload?.id ?? resumeRecord.id,
      userId: payload?.userId ?? resumeRecord.user_id,
      filename: payload?.filename ?? resumeRecord.filename,
      fileUrl: payload?.fileUrl ?? resumeRecord.file_url,
      url: payload?.fileUrl ?? resumeRecord.file_url,
      uploaded_at: payload?.uploadDate ?? resumeRecord.upload_date,
      status: payload?.status ?? resumeRecord.status,
      downloadUrl: payload?.downloadUrl ?? null,
      extractedText: payload?.extractedText ?? null,
    };

    if (extractionError) {
      responseData.textExtractionWarning = extractionError;
    }

    return res.status(201).json(responseData);
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

async function listResumes(req, res) {
  try {
    const userId = resolveUserId(req);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!isValidUUID(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID format' });
    }

    const resumeRows = await resumeModel.findByUserId(userId);
    const data = await Promise.all(resumeRows.map((row) => buildResumeResponse(row)));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('List resumes error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch resumes', error: err.message });
  }
}

async function getResume(req, res) {
  try {
    const userId = resolveUserId(req);

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (!isValidUUID(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID format' });
    }

    const resumeId = req.params?.id;

    if (!resumeId || !isValidUUID(resumeId)) {
      return res.status(400).json({ success: false, message: 'Invalid resume ID' });
    }

    const resumeRow = await resumeModel.findById(resumeId);

    if (!resumeRow || resumeRow.user_id !== userId) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const data = await buildResumeResponse(resumeRow);

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Get resume error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resume', error: err.message });
  }
}

module.exports = { uploadResume, listResumes, getResume };
