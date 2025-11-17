// src/models/resume.model.js
const REQUIRED_STRING_FIELDS = ['userId', 'filename', 'fileUrl', 'fileType'];

function ensurePositiveNumber(value, fieldName) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
}

function ensureRequiredStrings(payload) {
  for (const field of REQUIRED_STRING_FIELDS) {
    const value = payload[field];
    if (!value || typeof value !== 'string') {
      throw new Error(`${field} is required`);
    }
  }
}

class ResumeModel {
  constructor(db) {
    if (!db || typeof db.query !== 'function') {
      throw new Error('A database client with a query method is required');
    }

    this.db = db;
  }

  #validateCreatePayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload is required');
    }

    ensureRequiredStrings(payload);
    ensurePositiveNumber(payload.fileSize, 'fileSize');
  }

  async create(payload) {
    this.#validateCreatePayload(payload);

    const {
      userId,
      filename,
      fileUrl,
      fileSize,
      fileType,
      status = 'uploaded',
      uploadDate = new Date(),
      extractedText = null,
    } = payload;

    const text = `
      INSERT INTO resumes(
        user_id,
        filename,
        file_url,
        file_size,
        file_type,
        upload_date,
        status,
        extracted_text
      )
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `;

    const values = [
      userId,
      filename,
      fileUrl,
      fileSize,
      fileType,
      uploadDate,
      status,
      extractedText,
    ];

    const { rows } = await this.db.query(text, values);
    return rows[0];
  }

  async findByUserId(userId) {
    if (!userId) {
      throw new Error('userId is required');
    }

    const text = `
      SELECT *
      FROM resumes
      WHERE user_id = $1
      ORDER BY upload_date DESC
    `;

    const { rows } = await this.db.query(text, [userId]);
    return rows;
  }

  async findById(id) {
    if (!id) {
      throw new Error('id is required');
    }

    const text = `
      SELECT *
      FROM resumes
      WHERE id = $1
      LIMIT 1
    `;

    const { rows } = await this.db.query(text, [id]);
    return rows[0] || null;
  }
}

const isTestEnvironment =
  process.env.NODE_ENV === 'test'
  || process.env.npm_lifecycle_event === 'test'
  || process.env.TEST === 'true';

let resumeModel = null;

if (process.env.DATABASE_URL) {
  // Lazily require to avoid initializing a pool during tests
  // when DATABASE_URL is not available.
  const { pool } = require('../config/database');
  resumeModel = new ResumeModel(pool);
} else if (!isTestEnvironment) {
  console.warn('DATABASE_URL is not set. resumeModel will not be initialized.');
}

module.exports = {
  ResumeModel,
  resumeModel,
};