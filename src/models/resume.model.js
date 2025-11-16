const { pool } = require('../config/database');

class ResumeModel {
  constructor(db) {
    if (!db || typeof db.query !== 'function') {
      throw new Error('A database client with a query method is required');
    }

    this.db = db;
  }

  async create({
    userId,
    filename,
    fileUrl,
    fileSize,
    fileType,
    status = 'uploaded',
    uploadDate = new Date(),
  }) {
    const normalizedUserId = typeof userId === 'string' ? userId.trim() : userId ? String(userId) : '';
    if (!normalizedUserId) throw new Error('userId is required');

    const normalizedFilename = typeof filename === 'string' ? filename.trim() : filename;
    if (!normalizedFilename) throw new Error('filename is required');

    const normalizedFileUrl = typeof fileUrl === 'string' ? fileUrl.trim() : fileUrl;
    if (!normalizedFileUrl) throw new Error('fileUrl is required');

    const numericFileSize = Number(fileSize);
    if (!Number.isFinite(numericFileSize) || numericFileSize <= 0) {
      throw new Error('fileSize must be a positive number');
    }

    const normalizedFileType = typeof fileType === 'string' ? fileType.trim() : fileType;
    if (!normalizedFileType) throw new Error('fileType is required');

    const uploadDateValue = uploadDate instanceof Date ? uploadDate : new Date(uploadDate);
    if (!(uploadDateValue instanceof Date) || Number.isNaN(uploadDateValue.getTime())) {
      throw new Error('uploadDate must be a valid date');
    }

    const normalizedStatus = typeof status === 'string' && status.trim() ? status.trim() : 'uploaded';

    const insertQuery = `
      INSERT INTO resumes (
        user_id,
        filename,
        file_url,
        file_size,
        file_type,
        upload_date,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        user_id,
        filename,
        file_url,
        file_size,
        file_type,
        upload_date,
        status,
        created_at,
        updated_at;
    `;

    const values = [
      normalizedUserId,
      normalizedFilename,
      normalizedFileUrl,
      numericFileSize,
      normalizedFileType,
      uploadDateValue,
      normalizedStatus,
    ];
    const { rows } = await this.db.query(insertQuery, values);

    if (!rows || !rows[0]) {
      throw new Error('Failed to persist resume metadata');
    }

    return rows[0];
  }

  async findByUserId(userId) {
    if (!userId) throw new Error('userId is required');

    const normalizedUserId = typeof userId === 'string' ? userId.trim() : String(userId);
    if (!normalizedUserId) throw new Error('userId is required');

    const query = `
      SELECT
        id,
        user_id,
        filename,
        file_url,
        file_size,
        file_type,
        upload_date,
        status,
        created_at,
        updated_at
      FROM resumes
      WHERE user_id = $1
      ORDER BY upload_date DESC;
    `;

    const { rows } = await this.db.query(query, [normalizedUserId]);
    return rows;
  }

  async findById(id) {
    if (!id) throw new Error('id is required');

    const normalizedId = typeof id === 'string' ? id.trim() : String(id);
    if (!normalizedId) throw new Error('id is required');

    const query = `
      SELECT
        id,
        user_id,
        filename,
        file_url,
        file_size,
        file_type,
        upload_date,
        status,
        created_at,
        updated_at
      FROM resumes
      WHERE id = $1;
    `;

    const { rows } = await this.db.query(query, [normalizedId]);
    return rows[0] || null;
  }
}

const resumeModel = new ResumeModel(pool);

module.exports = { ResumeModel, resumeModel };