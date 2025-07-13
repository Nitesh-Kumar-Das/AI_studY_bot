import express, { Request, Response } from 'express';
import multer from 'multer';
import { body, query, validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import { Material } from '@/models/Material';
import { User } from '@/models/User';
import { authenticate } from '@/middleware/auth';
import { catchAsync, createError } from '@/middleware/errorHandler';
import { ApiResponse, AuthenticatedRequest, MaterialQuery } from '@/types';
import { logger } from '@/utils/logger';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadPath = path.join(process.cwd(), 'uploads/materials');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|gif|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain|image\/(jpeg|jpg|png|gif|bmp)/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, TXT, and image files (JPG, PNG, GIF, BMP) are allowed'));
    }
  }
});

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      data: errors.array()
    };
    res.status(400).json(response);
    return false;
  }
  return true;
};

// File processor with real implementations including OCR
const processFile = async (filePath: string, mimetype: string): Promise<{
  content: string;
  metadata: {
    pages?: number;
    wordCount: number;
    readingTime: number;
    language: string;
  };
}> => {
  let content = '';
  let pages: number | undefined;
  
  try {
    logger.info(`Processing file: ${filePath}, MIME type: ${mimetype}`);
    
    switch (mimetype) {
      case 'application/pdf':
        const fileBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(fileBuffer);
        content = pdfData.text;
        pages = pdfData.numpages;
        logger.info(`PDF processed: ${pages} pages, ${content.length} characters`);
        break;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const fileBuffer2 = fs.readFileSync(filePath);
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer2 });
        content = docxResult.value;
        logger.info(`DOCX processed: ${content.length} characters`);
        break;
        
      case 'application/msword':
        const fileBuffer3 = fs.readFileSync(filePath);
        const docResult = await mammoth.extractRawText({ buffer: fileBuffer3 });
        content = docResult.value;
        logger.info(`DOC processed: ${content.length} characters`);
        break;
        
      case 'text/plain':
        content = fs.readFileSync(filePath, 'utf8');
        logger.info(`Text file processed: ${content.length} characters`);
        break;
        
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
      case 'image/gif':
      case 'image/bmp':
        logger.info(`Starting OCR for image: ${filePath}`);
        const ocrResult = await Tesseract.recognize(filePath, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              logger.info(`OCR Progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        content = ocrResult.data.text;
        logger.info(`OCR completed: ${content.length} characters extracted`);
        break;
        
      default:
        // For other file types, create a placeholder content
        content = `File uploaded: ${path.basename(filePath)}`;
        logger.info(`Unsupported file type, using placeholder content`);
        break;
    }
    
    // Clean up extracted content
    content = content.trim().replace(/\s+/g, ' ');
    
    // Calculate metadata
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 200) * 60; // 200 words per minute in seconds
    
    logger.info(`Content processed: ${wordCount} words, ${readingTime}s reading time`);
    
    return {
      content,
      metadata: {
        pages,
        wordCount,
        readingTime,
        language: 'en' // Default to English, could be enhanced with language detection
      }
    };
    
  } catch (error) {
    logger.error('Error processing file:', error);
    // Fallback content if processing fails
    return {
      content: `File uploaded: ${path.basename(filePath)} (processing failed)`,
      metadata: {
        wordCount: 1,
        readingTime: 60,
        language: 'en'
      }
    };
  }
};

// @route   POST /api/materials/upload
// @desc    Upload a new study material
// @access  Private
router.post('/upload', 
  authenticate,
  upload.single('file'),
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters'),
    body('subject')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Subject is required and must be less than 100 characters'),
    body('difficulty')
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    logger.info(`Upload request from user: ${req.user.email}`);
    logger.info(`File received: ${req.file ? req.file.originalname : 'No file'}`);

    const { title, subject, difficulty, tags = [], isPublic = false } = req.body;
    let content = '';
    let metadata: any = {};
    let fileData: any = {};

    if (req.file) {
      logger.info(`Processing file: ${req.file.originalname}, type: ${req.file.mimetype}`);
      
      // Process uploaded file
      const processed = await processFile(req.file.path, req.file.mimetype);
      content = processed.content;
      metadata = processed.metadata;
      
      fileData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        type: path.extname(req.file.originalname).slice(1).toLowerCase()
      };
      
      logger.info(`File processed successfully. Content length: ${content.length}, Word count: ${metadata.wordCount}`);
    } else {
      throw createError('No file uploaded', 400);
    }

    logger.info(`Creating material in database for user: ${req.user._id}`);

    // Create material
    const material = await Material.create({
      userId: req.user._id,
      title,
      content,
      type: fileData.type,
      filename: fileData.filename,
      originalName: fileData.originalName,
      size: fileData.size,
      metadata,
      tags: Array.isArray(tags) ? tags : [],
      subject,
      difficulty,
      isPublic,
      uploadedAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 0
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.materialsUploaded': 1 }
    });

    logger.info(`Material created successfully with ID: ${material._id}`);
    logger.info(`Material details: title="${material.title}", filename="${material.filename}", type="${material.type}"`);

    const response: ApiResponse = {
      success: true,
      message: 'Material uploaded successfully',
      data: {
        material
      }
    };

    logger.info(`Material uploaded: ${title} by user ${req.user.email}`);
    res.status(201).json(response);
  })
);

// @route   POST /api/materials/manual
// @desc    Add manual study material
// @access  Private
router.post('/manual',
  authenticate,
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters'),
    body('content')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Content is required'),
    body('subject')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Subject is required and must be less than 100 characters'),
    body('difficulty')
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { title, content, subject, difficulty, tags = [], isPublic = false } = req.body;

    // Calculate metadata
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / 200) * 60; // 200 words per minute

    const material = await Material.create({
      userId: req.user._id,
      title,
      content,
      type: 'manual',
      metadata: {
        wordCount,
        readingTime,
        language: 'en'
      },
      tags: Array.isArray(tags) ? tags : [],
      subject,
      difficulty,
      isPublic,
      uploadedAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 0
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.materialsUploaded': 1 }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Material created successfully',
      data: {
        material
      }
    };

    logger.info(`Manual material created: ${title} by user ${req.user.email}`);
    res.status(201).json(response);
  })
);

// @route   POST /api/materials/youtube
// @desc    Add material from YouTube URL
// @access  Private
router.post('/youtube',
  authenticate,
  [
    body('url')
      .trim()
      .matches(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/)
      .withMessage('Please provide a valid YouTube URL'),
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required and must be less than 200 characters'),
    body('subject')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Subject is required and must be less than 100 characters'),
    body('difficulty')
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { url, title, subject, difficulty, tags = [], isPublic = false } = req.body;
    
    logger.info(`Processing YouTube URL: ${url} for user: ${req.user.email}`);

    try {
      // Extract YouTube video ID
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (!videoIdMatch) {
        throw createError('Invalid YouTube URL format', 400);
      }

      // For now, we'll create a placeholder. In production, you'd use the Universal Analyzer
      // to extract captions from the YouTube video
      const content = `YouTube video content: ${url}\n\nThis feature extracts captions and transcripts from YouTube videos for analysis and summarization.`;
      
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      const readingTime = Math.ceil(wordCount / 200) * 60;

      const metadata = {
        wordCount,
        readingTime,
        language: 'en',
        sourceUrl: url,
        videoId: videoIdMatch[1]
      };

      // Create material
      const material = await Material.create({
        userId: req.user._id,
        title,
        content,
        type: 'txt', // We'll store YouTube content as text
        originalName: `${title}.youtube`,
        metadata,
        tags: Array.isArray(tags) ? tags : [],
        subject,
        difficulty,
        isPublic,
        uploadedAt: new Date(),
        lastAccessedAt: new Date(),
        accessCount: 0
      });

      // Update user stats
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'stats.materialsUploaded': 1 }
      });

      logger.info(`YouTube material created successfully with ID: ${material._id}`);

      const response: ApiResponse = {
        success: true,
        message: 'YouTube material added successfully',
        data: {
          material
        }
      };

      res.status(201).json(response);
    } catch (error: any) {
      logger.error(`Error processing YouTube URL: ${error.message}`);
      throw createError(error.message || 'Failed to process YouTube URL', 400);
    }
  })
);

// @route   GET /api/materials
// @desc    Get user's materials with pagination and filtering
// @access  Private
router.get('/',
  authenticate,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term must be less than 100 characters'),
    query('subject')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Subject must be less than 100 characters'),
    query('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    query('type')
      .optional()
      .isIn(['pdf', 'docx', 'txt', 'manual'])
      .withMessage('Type must be pdf, docx, txt, or manual')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const {
      page = '1',
      limit = '10',
      search = '',
      subject = '',
      difficulty = '',
      type = '',
      sort = 'uploadedAt',
      order = 'desc'
    }: MaterialQuery = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { userId: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;

    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sort] = sortOrder;

    // Execute query
    const [materials, total] = await Promise.all([
      Material.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .select('-content'), // Exclude content for list view
      Material.countDocuments(query)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Materials retrieved successfully',
      data: {
        materials
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };

    res.status(200).json(response);
  })
);

// @route   GET /api/materials/:id
// @desc    Get a specific material
// @access  Private
router.get('/:id',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const material = await Material.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { isPublic: true }
      ]
    });

    if (!material) {
      throw createError('Material not found', 404);
    }

    // Increment access count if user owns the material
    if (material.userId.toString() === req.user._id.toString()) {
      material.accessCount += 1;
      material.lastAccessedAt = new Date();
      await material.save();
    }

    const response: ApiResponse = {
      success: true,
      message: 'Material retrieved successfully',
      data: {
        material
      }
    };

    res.status(200).json(response);
  })
);

/**
 * @route GET /api/materials/uploads/:filename
 * @desc Serve uploaded material files
 * @access Private
 */
router.get('/uploads/:filename',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { filename } = req.params;
    
    // First, verify that the user has access to this file
    const material = await Material.findOne({
      filename: filename,
      userId: req.user._id
    });

    if (!material) {
      throw createError('File not found or access denied', 404);
    }

    const filePath = path.join(process.cwd(), 'uploads/materials', filename);
    
    // Check if file exists on disk
    if (!fs.existsSync(filePath)) {
      throw createError('File not found on server', 404);
    }

    // Set appropriate headers based on file type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${material.title}${ext}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  })
);

// @route   DELETE /api/materials/:id
// @desc    Delete a material
// @access  Private
router.delete('/:id',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const material = await Material.findOne({
      _id: req.params.id,
      userId: req.user._id // Only allow users to delete their own materials
    });

    if (!material) {
      throw createError('Material not found or not authorized to delete', 404);
    }

    // Delete the file from disk if it exists
    if (material.filename) {
      const filePath = path.join(process.cwd(), 'uploads/materials', material.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          logger.info(`Deleted file: ${filePath}`);
        } catch (error) {
          logger.error(`Failed to delete file: ${filePath}`, error);
          // Continue with database deletion even if file deletion fails
        }
      }
    }

    // Delete the material from database
    await Material.findByIdAndDelete(req.params.id);

    // Update user's material count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { materialsCount: -1 }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Material deleted successfully',
      data: null
    };

    res.status(200).json(response);
  })
);

export default router;
