import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { authenticate } from '@/middleware/auth';
import { catchAsync, createError } from '@/middleware/errorHandler';
import { ApiResponse, AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { 
  aiBotManager, 
  SummaryRequest, 
  ScheduleRequest,
  MaterialContent,
  ScheduledSession 
} from '@/ai-bot';
import { Material } from '@/models/Material';
import { Summary } from '@/models/Summary';
import { User } from '@/models/User';

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('🚫 Validation errors:', JSON.stringify(errors.array(), null, 2));
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

/**
 * @route POST /api/ai/summary/generate
 * @desc Generate AI summary for a material
 * @access Private
 */
router.post('/summary/generate', [
  authenticate,
  body('materialId').isString().notEmpty().withMessage('Material ID is required'),
  body('summaryType').isIn(['brief', 'detailed', 'key-points', 'flashcards']).withMessage('Valid summary type is required'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Valid difficulty level is required'),
  body('focusAreas').optional().isArray({ max: 5 }).withMessage('Focus areas must be an array with max 5 items'),
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!handleValidationErrors(req, res)) return;

  const { materialId, summaryType, difficulty = 'intermediate', focusAreas } = req.body;

  // Sample materials for demo purposes
  const sampleMaterials = {
    'sample-material-1': {
      title: 'Introduction to Machine Learning',
      content: 'Machine Learning is a subset of artificial intelligence that focuses on algorithms that can learn and make predictions from data. ML algorithms build mathematical models based on training data to make predictions or decisions without being explicitly programmed to do so. The field encompasses supervised learning, unsupervised learning, and reinforcement learning approaches. Common applications include image recognition, natural language processing, recommendation systems, and predictive analytics.',
      type: 'text',
      uploadedAt: new Date('2025-01-01')
    },
    'sample-material-2': {
      title: 'Neural Networks Fundamentals',
      content: 'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes called neurons organized in layers. Each connection has an associated weight that adjusts as learning proceeds. Neural networks can learn complex patterns and relationships in data through backpropagation and gradient descent optimization. They form the foundation of deep learning and are used in applications like computer vision, speech recognition, and game playing.',
      type: 'pdf',
      uploadedAt: new Date('2025-01-02')
    },
    'sample-material-3': {
      title: 'Deep Learning Applications',
      content: 'Deep learning has revolutionized many fields including computer vision, natural language processing, and robotics. Convolutional Neural Networks (CNNs) excel at image recognition tasks. Recurrent Neural Networks (RNNs) and Transformers are powerful for sequence modeling and language tasks. Applications include autonomous vehicles, medical diagnosis, language translation, content generation, and scientific research. The field continues to advance with new architectures and training techniques.',
      type: 'video',
      uploadedAt: new Date('2025-01-03')
    }
  };

  let material: any = null;
  let materialContent: MaterialContent;

  // Check if it's a sample material first
  if (materialId.startsWith('sample-material-')) {
    const sampleMaterial = sampleMaterials[materialId as keyof typeof sampleMaterials];
    if (sampleMaterial) {
      materialContent = {
        id: materialId,
        title: sampleMaterial.title,
        content: sampleMaterial.content,
        type: sampleMaterial.type as any,
        metadata: {
          uploadedAt: sampleMaterial.uploadedAt,
          fileSize: sampleMaterial.content.length,
        },
      };
    } else {
      throw createError('Sample material not found', 404);
    }
  } else {
    // Check if it's a valid ObjectId before querying database
    if (!mongoose.Types.ObjectId.isValid(materialId)) {
      throw createError('Invalid material ID format', 400);
    }

    // Try to find in database
    material = await Material.findOne({
      _id: materialId,
      $or: [
        { userId: req.user!._id },
        { isPublic: true }
      ]
    });

    if (!material) {
      throw createError('Material not found or access denied', 404);
    }

    // Convert to AI bot format
    materialContent = {
      id: material._id.toString(),
      title: material.title,
      content: (material as any).content || (material as any).extractedText || '',
      type: material.type as any,
      metadata: {
        uploadedAt: material.uploadedAt,
        fileSize: (material as any).fileSize || 0,
      },
    };
  }

  if (!materialContent.content) {
    throw createError('Material has no content to summarize', 400);
  }

  // Create summary request
  const summaryRequest: SummaryRequest = {
    material: materialContent,
    summaryType,
    difficulty,
    focusAreas,
  };

  try {
    // Generate summary using AI bot (async)
    const jobId = await aiBotManager.createSummary(summaryRequest);

    const response: ApiResponse = {
      success: true,
      message: 'Summary generation started',
      data: {
        jobId,
        status: 'processing',
        estimatedTime: '30-60 seconds'
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('AI summary generation failed:', error);
    throw createError('Failed to generate AI summary', 500);
  }
}));

/**
 * @route GET /api/ai/job/:jobId
 * @desc Get AI processing job status
 * @access Private
 */
router.get('/job/:jobId', [
  authenticate,
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { jobId } = req.params;

  const status = aiBotManager.getJobStatus(jobId);
  
  if (!status) {
    throw createError('Job not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Job status retrieved',
    data: {
      id: status.id,
      type: status.type,
      status: status.status,
      progress: status.progress,
      startedAt: status.startedAt,
      completedAt: status.completedAt,
      result: status.result,
      error: status.error,
    }
  };

  res.json(response);
}));

/**
 * @route GET /api/ai/demo/job/:jobId
 * @desc Get demo AI processing job status (no auth required)
 * @access Public
 */
router.get('/demo/job/:jobId', catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const status = aiBotManager.getJobStatus(jobId);
  
  if (!status) {
    throw createError('Demo job not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'Demo job status retrieved',
    data: {
      id: status.id,
      type: status.type,
      status: status.status,
      progress: status.progress,
      startedAt: status.startedAt,
      completedAt: status.completedAt,
      result: status.result,
      error: status.error,
    }
  };

  res.json(response);
}));

/**
 * @route POST /api/ai/schedule/generate
 * @desc Generate AI study schedule
 * @access Private
 */
router.post('/schedule/generate', [
  authenticate,
  body('materialIds').isArray({ min: 1, max: 20 }).withMessage('Material IDs array is required (1-20 items)'),
  body('preferences').isObject().withMessage('User preferences object is required'),
  body('preferences.availableHours').isObject().withMessage('Available hours is required'),
  body('preferences.preferredSessionLength').isInt({ min: 15, max: 180 }).withMessage('Session length must be 15-180 minutes'),
  body('preferences.maxSessionsPerDay').isInt({ min: 1, max: 6 }).withMessage('Max sessions per day must be 1-6'),
  body('preferences.learningStyle').isIn(['visual', 'auditory', 'kinesthetic', 'reading']).withMessage('Valid learning style is required'),
  body('goals').isObject().withMessage('Goals object is required'),
  body('goals.priority').isIn(['speed', 'retention', 'balanced']).withMessage('Valid priority is required'),
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!handleValidationErrors(req, res)) return;

  const { materialIds, preferences, goals } = req.body;

  // Find all materials
  const materials = await Material.find({
    _id: { $in: materialIds },
    $or: [
      { userId: req.user!._id },
      { isPublic: true }
    ]
  });

  if (materials.length === 0) {
    throw createError('No accessible materials found', 404);
  }

  // Convert to AI bot format
  const materialContents: MaterialContent[] = materials.map(material => ({
    id: material._id.toString(),
    title: material.title,
    content: (material as any).content || (material as any).extractedText || '',
    type: material.type as any,
    metadata: {
      uploadedAt: material.uploadedAt,
      fileSize: (material as any).fileSize || 0,
    },
  }));

  // Create schedule request
  const scheduleRequest: ScheduleRequest = {
    materials: materialContents,
    userPreferences: {
      availableHours: preferences.availableHours,
      preferredSessionLength: preferences.preferredSessionLength,
      maxSessionsPerDay: preferences.maxSessionsPerDay,
      learningStyle: preferences.learningStyle,
      difficultyProgression: preferences.difficultyProgression || 'adaptive',
    },
    goals: {
      targetCompletionDate: goals.targetCompletionDate ? new Date(goals.targetCompletionDate) : undefined,
      priority: goals.priority,
      reviewFrequency: goals.reviewFrequency || 'weekly',
    },
  };

  try {
    // Generate schedule using AI bot
    const jobId = await aiBotManager.createSchedule(scheduleRequest);

    const response: ApiResponse = {
      success: true,
      message: 'Schedule generation started',
      data: {
        jobId,
        status: 'processing',
        estimatedTime: '30-60 seconds'
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('AI schedule generation failed:', error);
    throw createError('Failed to generate AI schedule', 500);
  }
}));

/**
 * @route GET /api/ai/test
 * @desc Test AI service connectivity
 * @access Private
 */
router.get('/test', [
  authenticate,
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isConnected = await aiBotManager.testConnection();
    
    const response: ApiResponse = {
      success: isConnected,
      message: isConnected ? 'AI service is available' : 'AI service is unavailable',
      data: {
        connected: isConnected,
        timestamp: new Date().toISOString(),
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('AI service test failed:', error);
    
    const response: ApiResponse = {
      success: false,
      message: 'AI service test failed',
      error: 'AI_SERVICE_ERROR',
      data: {
        connected: false,
        error: error.message,
      }
    };

    res.status(500).json(response);
  }
}));

/**
 * @route GET /api/ai/stats
 * @desc Get AI usage statistics for user
 * @access Private
 */
router.get('/stats', [
  authenticate,
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user's summaries for stats
    const summaries = await Summary.find({ userId: req.user!._id });
    
    // Get summary statistics
    const summaryStats = await aiBotManager.getSummaryStats(summaries);
    
    // Get active jobs
    const activeJobs = aiBotManager.getActiveJobs();
    const userActiveJobs = activeJobs.length; // In a real app, filter by user
    
    const response: ApiResponse = {
      success: true,
      message: 'AI statistics retrieved',
      data: {
        summaryStats,
        activeJobs: userActiveJobs,
        totalJobs: summaries.length,
        lastGenerated: summaries.length > 0 ? summaries[summaries.length - 1].generatedAt : null,
      }
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Failed to get AI stats:', error);
    throw createError('Failed to retrieve AI statistics', 500);
  }
}));

/**
 * @route GET /api/ai/health
 * @desc Public health check for AI service
 * @access Public
 */
router.get('/health', catchAsync(async (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'AI service is healthy',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  res.json(response);
}));

/**
 * @route POST /api/ai/demo/summary/generate
 * @desc Generate AI summary for sample materials (no auth required)
 * @access Public
 */
router.post('/demo/summary/generate', [
  body('materialId').isString().notEmpty().withMessage('Material ID is required'),
  body('summaryType').isIn(['brief', 'detailed', 'key-points', 'flashcards']).withMessage('Valid summary type is required'),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Valid difficulty level is required'),
  body('focusAreas').optional().isArray({ max: 5 }).withMessage('Focus areas must be an array with max 5 items'),
], catchAsync(async (req: Request, res: Response) => {
  // Add debug logging
  console.log('🔍 Demo summary generate endpoint called');
  console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
  
  if (!handleValidationErrors(req, res)) return;

  const { materialId, summaryType, difficulty = 'intermediate', focusAreas } = req.body;

  // Only allow sample materials for demo
  if (!materialId.startsWith('sample-material-')) {
    throw createError('Demo mode only supports sample materials', 400);
  }

  // Sample materials for demo purposes
  const sampleMaterials = {
    'sample-material-1': {
      title: 'Introduction to Machine Learning',
      content: 'Machine Learning is a subset of artificial intelligence that focuses on algorithms that can learn and make predictions from data. ML algorithms build mathematical models based on training data to make predictions or decisions without being explicitly programmed to do so. The field encompasses supervised learning, unsupervised learning, and reinforcement learning approaches. Common applications include image recognition, natural language processing, recommendation systems, and predictive analytics.',
      type: 'text',
      uploadedAt: new Date('2025-01-01')
    },
    'sample-material-2': {
      title: 'Neural Networks Fundamentals',
      content: 'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes called neurons organized in layers. Each connection has an associated weight that adjusts as learning proceeds. Neural networks can learn complex patterns and relationships in data through backpropagation and gradient descent optimization. They form the foundation of deep learning and are used in applications like computer vision, speech recognition, and game playing.',
      type: 'pdf',
      uploadedAt: new Date('2025-01-02')
    },
    'sample-material-3': {
      title: 'Deep Learning Applications',
      content: 'Deep learning has revolutionized many fields including computer vision, natural language processing, and robotics. Convolutional Neural Networks (CNNs) excel at image recognition tasks. Recurrent Neural Networks (RNNs) and Transformers are powerful for sequence modeling and language tasks. Applications include autonomous vehicles, medical diagnosis, language translation, content generation, and scientific research. The field continues to advance with new architectures and training techniques.',
      type: 'video',
      uploadedAt: new Date('2025-01-03')
    }
  };

  const sampleMaterial = sampleMaterials[materialId as keyof typeof sampleMaterials];
  if (!sampleMaterial) {
    throw createError('Sample material not found', 404);
  }

  // Convert to AI bot format
  const materialContent: MaterialContent = {
    id: materialId,
    title: sampleMaterial.title,
    content: sampleMaterial.content,
    type: sampleMaterial.type as any,
    metadata: {
      uploadedAt: sampleMaterial.uploadedAt,
      fileSize: sampleMaterial.content.length,
    },
  };

  // Create summary request
  const summaryRequest: SummaryRequest = {
    material: materialContent,
    summaryType,
    difficulty,
    focusAreas,
  };

  try {
    // Generate summary using AI bot (async)
    const jobId = await aiBotManager.createSummary(summaryRequest);

    const response: ApiResponse = {
      success: true,
      message: 'Demo summary generation started',
      data: {
        jobId,
        status: 'processing',
        estimatedTime: '30-60 seconds'
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('Demo AI summary generation failed:', error);
    throw createError('Failed to generate demo AI summary', 500);
  }
}));

/**
 * @route POST /api/ai/flashcards/generate
 * @desc Generate flashcards for a topic
 * @access Private
 */
router.post('/flashcards/generate', [
  authenticate,
  body('topic').isString().notEmpty().withMessage('Topic is required'),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('Count must be between 1 and 20'),
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!handleValidationErrors(req, res)) return;

  const { topic, count = 5 } = req.body;

  try {
    const jobId = await aiBotManager.createFlashcards(topic, count);

    const response: ApiResponse = {
      success: true,
      message: 'Flashcard generation started',
      data: {
        jobId,
        status: 'processing',
        topic,
        count
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('Flashcard generation failed:', error);
    throw createError('Failed to generate flashcards', 500);
  }
}));

/**
 * @route POST /api/ai/quiz/generate
 * @desc Generate quiz questions for a topic
 * @access Private
 */
router.post('/quiz/generate', [
  authenticate,
  body('topic').isString().notEmpty().withMessage('Topic is required'),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('Count must be between 1 and 20'),
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!handleValidationErrors(req, res)) return;

  const { topic, count = 5 } = req.body;

  try {
    const jobId = await aiBotManager.createQuiz(topic, count);

    const response: ApiResponse = {
      success: true,
      message: 'Quiz generation started',
      data: {
        jobId,
        status: 'processing',
        topic,
        count
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('Quiz generation failed:', error);
    throw createError('Failed to generate quiz', 500);
  }
}));

/**
 * @route POST /api/ai/notes/generate
 * @desc Generate smart notes from content
 * @access Private
 */
router.post('/notes/generate', [
  authenticate,
  body('content').isString().notEmpty().withMessage('Content is required'),
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!handleValidationErrors(req, res)) return;

  const { content } = req.body;

  try {
    const jobId = await aiBotManager.createSmartNotes(content);

    const response: ApiResponse = {
      success: true,
      message: 'Smart notes generation started',
      data: {
        jobId,
        status: 'processing'
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('Smart notes generation failed:', error);
    throw createError('Failed to generate smart notes', 500);
  }
}));

/**
 * @route POST /api/ai/schedule/generate
 * @desc Generate study schedule
 * @access Private
 */
router.post('/schedule/generate', [
  authenticate,
  body('topics').isArray({ min: 1 }).withMessage('Topics array is required'),
  body('totalHours').isFloat({ min: 1 }).withMessage('Total hours must be a positive number'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!handleValidationErrors(req, res)) return;

  const { topics, totalHours, startDate, endDate } = req.body;

  try {
    const jobId = await aiBotManager.createSimpleSchedule(topics, totalHours, startDate, endDate);

    const response: ApiResponse = {
      success: true,
      message: 'Study schedule generation started',
      data: {
        jobId,
        status: 'processing',
        topics,
        totalHours,
        startDate,
        endDate
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('Schedule generation failed:', error);
    throw createError('Failed to generate schedule', 500);
  }
}));

/**
 * @route POST /api/ai/study-plan/generate
 * @desc Generate study plan recommendations
 * @access Private
 */
router.post('/study-plan/generate', [
  authenticate,
  body('goal').isString().notEmpty().withMessage('Goal is required'),
  body('availableHours').isFloat({ min: 1 }).withMessage('Available hours must be a positive number'),
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!handleValidationErrors(req, res)) return;

  const { goal, availableHours } = req.body;

  try {
    const jobId = await aiBotManager.createStudyPlan(goal, availableHours);

    const response: ApiResponse = {
      success: true,
      message: 'Study plan generation started',
      data: {
        jobId,
        status: 'processing',
        goal,
        availableHours
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('Study plan generation failed:', error);
    throw createError('Failed to generate study plan', 500);
  }
}));

/**
 * @route POST /api/ai/analyze/text
 * @desc Analyze text content and generate comprehensive learning materials
 * @access Private
 */
router.post('/analyze/text', [
  authenticate,
  body('content').isString().notEmpty().withMessage('Content is required'),
  body('options').optional().isObject().withMessage('Options must be an object'),
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!handleValidationErrors(req, res)) return;

  const { content, options = {} } = req.body;

  try {
    const jobId = await aiBotManager.createUniversalAnalysis({
      source: { type: 'text', content },
      options
    });

    const response: ApiResponse = {
      success: true,
      message: 'Text analysis started',
      data: {
        jobId,
        status: 'processing'
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('Text analysis failed:', error);
    throw createError('Failed to analyze text', 500);
  }
}));

/**
 * @route POST /api/ai/analyze/youtube
 * @desc Analyze YouTube video transcript and generate learning materials
 * @access Private
 */
router.post('/analyze/youtube', [
  authenticate,
  body('url').isURL().withMessage('Valid YouTube URL is required'),
  body('options').optional().isObject().withMessage('Options must be an object'),
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  if (!handleValidationErrors(req, res)) return;

  const { url, options = {} } = req.body;

  try {
    const jobId = await aiBotManager.createUniversalAnalysis({
      source: { type: 'youtube', url },
      options
    });

    const response: ApiResponse = {
      success: true,
      message: 'YouTube video analysis started',
      data: {
        jobId,
        status: 'processing',
        url
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('YouTube analysis failed:', error);
    throw createError('Failed to analyze YouTube video', 500);
  }
}));

/**
 * @route POST /api/ai/analyze/upload
 * @desc Upload and analyze file (PDF, DOCX, or Image)
 * @access Private
 */
router.post('/analyze/upload', [
  authenticate,
  // Note: File upload middleware would be added here (multer)
], catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  // This endpoint would handle file uploads
  // Implementation would depend on multer configuration
  
  try {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const file = req.file;
    const options = req.body.options ? JSON.parse(req.body.options) : {};
    
    // Determine file type
    let sourceType: 'pdf' | 'docx' | 'image';
    
    if (file.mimetype === 'application/pdf') {
      sourceType = 'pdf';
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      sourceType = 'docx';
    } else if (file.mimetype.startsWith('image/')) {
      sourceType = 'image';
    } else {
      throw createError('Unsupported file type', 400);
    }

    const jobId = await aiBotManager.createUniversalAnalysis({
      source: { 
        type: sourceType, 
        buffer: sourceType !== 'image' ? file.buffer : undefined,
        filePath: sourceType === 'image' ? file.path : undefined
      },
      options
    });

    const response: ApiResponse = {
      success: true,
      message: `${sourceType.toUpperCase()} analysis started`,
      data: {
        jobId,
        status: 'processing',
        fileName: file.originalname,
        fileType: sourceType
      }
    };

    res.status(202).json(response);
  } catch (error: any) {
    logger.error('File analysis failed:', error);
    throw createError('Failed to analyze file', 500);
  }
}));

export default router;
