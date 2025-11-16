const test = require('node:test');
const assert = require('node:assert/strict');
const { ResumeModel } = require('../src/models/resume.model');

test('ResumeModel#create stores metadata and returns the persisted row', async () => {
  const recordedQueries = [];
  const uploadDate = new Date('2024-01-01T12:00:00Z');
  const expectedRow = {
    id: 'f8a57b03-ae46-4a07-8f1b-8739e1dd1f0d',
    user_id: 'e7cd2aea-0110-4111-9b73-93bb0b373f26',
    filename: 'resume.pdf',
    file_url: 'https://example.com/resume.pdf',
    file_size: 1500,
    file_type: 'application/pdf',
    upload_date: uploadDate,
    status: 'processed',
    created_at: uploadDate,
    updated_at: uploadDate,
  };

  const mockDb = {
    async query(text, params) {
      recordedQueries.push({ text, params });
      return { rows: [expectedRow] };
    },
  };

  const model = new ResumeModel(mockDb);
  const payload = {
    userId: expectedRow.user_id,
    filename: expectedRow.filename,
    fileUrl: expectedRow.file_url,
    fileSize: expectedRow.file_size,
    fileType: expectedRow.file_type,
    status: expectedRow.status,
    uploadDate,
  };

  const result = await model.create(payload);

  assert.strictEqual(recordedQueries.length, 1);
  assert.ok(recordedQueries[0].text.includes('INSERT INTO resumes'));
  assert.deepStrictEqual(recordedQueries[0].params, [
    expectedRow.user_id,
    expectedRow.filename,
    expectedRow.file_url,
    expectedRow.file_size,
    expectedRow.file_type,
    uploadDate,
    expectedRow.status,
  ]);
  assert.deepStrictEqual(result, expectedRow);
});

test('ResumeModel#create applies default status when none is supplied', async () => {
  let capturedParams;
  const mockDb = {
    async query(text, params) {
      capturedParams = params;
      return { rows: [{ id: 'generated-id' }] };
    },
  };

  const model = new ResumeModel(mockDb);
  await model.create({
    userId: '1b6f508d-e9a1-4fa3-83af-1dcd764cb2b5',
    filename: 'resume.pdf',
    fileUrl: 'https://example.com/resume.pdf',
    fileSize: 2048,
    fileType: 'application/pdf',
  });

  assert.strictEqual(capturedParams[6], 'uploaded');
});

test('ResumeModel#create validates positive file size', async () => {
  const mockDb = {
    async query() {
      throw new Error('Query should not be executed for invalid input');
    },
  };

  const model = new ResumeModel(mockDb);

  await assert.rejects(
    () => model.create({
      userId: '1b6f508d-e9a1-4fa3-83af-1dcd764cb2b5',
      filename: 'resume.pdf',
      fileUrl: 'https://example.com/resume.pdf',
      fileSize: 0,
      fileType: 'application/pdf',
    }),
    {
      message: 'fileSize must be a positive number',
    },
  );
});

test('ResumeModel#create throws when required fields are missing', async () => {
  const mockDb = { async query() { return { rows: [] }; } };
  const model = new ResumeModel(mockDb);

  await assert.rejects(
    () => model.create({ filename: 'resume.pdf' }),
    {
      message: 'userId is required',
    },
  );
});