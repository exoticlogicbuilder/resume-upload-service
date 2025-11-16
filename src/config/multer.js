// src/config/multer.js
const multer = require('multer');

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || String(2 * 1024 * 1024), 10); // 2MB default

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only PDF MIME type
  if (file.mimetype !== 'application/pdf') {
    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    err.message = 'Invalid file type. Only PDF files are allowed.';
    return cb(err, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter,
});

module.exports = upload;
