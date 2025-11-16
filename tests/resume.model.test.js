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
    extracted_text: null,
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
    null,
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
  assert.strictEqual(capturedParams[7], null);
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

test('ResumeModel#findByUserId queries resumes for the specified user', async () => {
  const expectedRows = [{ id: '1' }, { id: '2' }];
  const recordedQueries = [];
  const mockDb = {
    async query(text, params) {
      recordedQueries.push({ text, params });
      return { rows: expectedRows };
    },
  };

  const model = new ResumeModel(mockDb);
  const userId = '8b7b43c1-6a3a-4d75-a965-9f4f4be52b49';
  const result = await model.findByUserId(userId);

  assert.deepStrictEqual(result, expectedRows);
  assert.strictEqual(recordedQueries.length, 1);
  assert.ok(recordedQueries[0].text.includes('WHERE user_id = $1'));
  assert.ok(recordedQueries[0].text.includes('ORDER BY upload_date DESC'));
  assert.deepStrictEqual(recordedQueries[0].params, [userId]);
});

test('ResumeModel#findById returns the matching resume or null', async () => {
  const expectedRow = { id: 'c6c1bfd1-62bd-4d2d-bbb0-ccf0f2991b03' };
  const mockDb = {
    async query(text, params) {
      if (params[0] === expectedRow.id) {
        return { rows: [expectedRow] };
      }
      return { rows: [] };
    },
  };

  const model = new ResumeModel(mockDb);
  const found = await model.findById(expectedRow.id);
  const missing = await model.findById('20b0b405-ff8c-4f94-8757-ec72b881b18a');

  assert.deepStrictEqual(found, expectedRow);
  assert.strictEqual(missing, null);
});