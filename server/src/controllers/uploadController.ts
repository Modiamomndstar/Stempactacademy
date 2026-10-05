import { Request, Response } from 'express';
import multer from 'multer';
import { r2Service } from '../services/storage/r2Service.js';
import { AuthRequest } from '../middlewares/auth.js';

// Configure Multer with memory storage
const storage = multer.memoryStorage();

// Allowed file types: images and documents
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, GIF, PDF, and DOC files are accepted.'));
    }
  },
});

/**
 * Handle Single File Upload (e.g., bank transfer teller, receipt, student assignment)
 */
export const uploadSingleFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file provided for upload.' });
      return;
    }

    const folder = (req.body.folder || 'receipts').replace(/[^a-zA-Z0-9_-]/g, '');

    const result = await r2Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      ...result,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload file.' });
  }
};

/**
 * Get Storage Connection Status
 */
export const getStorageStatus = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json(r2Service.getStatus());
};
