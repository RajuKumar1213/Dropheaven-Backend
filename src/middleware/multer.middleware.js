import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure temp directory exists
const tempDir = './public/temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Define allowed file types and their mime types
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

// Combine all allowed mime types
const ALLOWED_MIME_TYPES = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.documents,
];

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;

    cb(null, fileName);
  },
});

// Validate file types
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      ),
      false
    );
  }
};

// Create multer instance with configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB size limit
    files: 5, // Maximum 5 files per upload
  },
});

// Custom middleware to handle multer errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err.message.includes('Unsupported file type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
};

// Cleanup middleware to remove temp files after upload
export const cleanupFiles = async (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);

  res.on('finish', () => {
    files.forEach((file) => {
      if (file.path) {
        fs.unlink(file.path, (err) => {
          if (err)
            console.error(`Failed to cleanup temp file: ${file.path}`, err);
        });
      }
    });
  });

  next();
};

// Export specialized upload functions for different use cases
export const documentUpload = upload.array('documents', 5);
export const singleDocumentUpload = upload.single('document');
export const profileImageUpload = upload.single('profileImage');
