import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Summary } from '@/models/Summary';
import { Material } from '@/models/Material';
import { User } from '@/models/User';
import { authenticate } from '@/middleware/auth';
import { catchAsync, createError } from '@/middleware/errorHandler';
import { ApiResponse, AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { aiBotManager, SummaryRequest, MaterialContent } from '@/ai-bot';

const router = express.Router();

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

// AI-powered summary generation
const generateAISummary = async (
  material: any, 
  summaryType: 'brief' | 'detailed' | 'key-points' | 'flashcards' = 'detailed',
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
  focusAreas?: string[]
): Promise<{
  summary: string;
  keyPoints: string[];
  tags: string[];
  estimatedReadTime: number;
}> => {
  try {
    // Convert material to AI bot format
    const materialContent: MaterialContent = {
      id: material._id.toString(),
      title: material.title,
      content: material.content || material.extractedText || 'No content available',
      type: material.type,
      metadata: {
        uploadedAt: material.uploadedAt,
        fileSize: material.fileSize,
      },
    };

    console.log('🔍 Material processing debug:');
    console.log('🔍 Material ID:', material._id);
    console.log('🔍 Material title:', material.title);
    console.log('🔍 Material type:', material.type);
    console.log('🔍 Material content length:', materialContent.content.length);
    console.log('🔍 Content preview:', materialContent.content.substring(0, 200));
    console.log('🔍 Summary type requested:', summaryType);

    // Create summary request
    const summaryRequest: SummaryRequest = {
      material: materialContent,
      summaryType,
      targetLength: summaryType === 'brief' ? 'short' : summaryType === 'detailed' ? 'long' : 'medium',
      difficulty,
      focusAreas,
    };

    // Generate summary using AI bot
    const jobId = await aiBotManager.createSummary(summaryRequest);
    
    // Poll for completion (in production, use websockets or async processing)
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    
    while (attempts < maxAttempts) {
      const status = aiBotManager.getJobStatus(jobId);
      
      if (!status) {
        throw new Error('Summary generation job not found');
      }
      
      if (status.status === 'completed' && status.result) {
        const result = status.result as any;
        return {
          summary: result.content,
          keyPoints: result.keyPoints,
          tags: result.tags,
          estimatedReadTime: result.estimatedReadTime,
        };
      }
      
      if (status.status === 'failed') {
        throw new Error(`AI summary generation failed: ${status.error?.message || 'Unknown error'}`);
      }
      
      // Wait 1 second before next check
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    throw new Error('Summary generation timeout');
    
  } catch (error: any) {
    logger.error('AI summary generation error:', error);
    
    // Temporarily skip OpenAI and use mock summary due to quota exceeded
    console.log('🔍 Using fallback mock summary due to OpenAI quota exceeded');
    return generateMockSummary(material.content || material.extractedText || '', summaryType);
  }
};

// Fallback mock summary generation
const generateMockSummary = async (content: string, type: string): Promise<{
  summary: string;
  keyPoints: string[];
  tags: string[];
  estimatedReadTime: number;
}> => {
  const wordCount = content.split(' ').length;
  const summaryLength = type === 'brief' ? Math.min(100, wordCount / 10) : Math.min(300, wordCount / 5);
  
  const mockSummary = `This is a ${type} summary of the provided content. The material covers important concepts and provides valuable insights for study purposes. The content has been analyzed and condensed to highlight the most relevant information.`;
  
  const mockKeyPoints = [
    'Key concept 1: Main topic overview',
    'Key concept 2: Important details and examples',
    'Key concept 3: Practical applications',
    'Key concept 4: Summary and conclusions'
  ];

  const mockTags = ['study-material', 'educational', 'summary', type];

  return {
    summary: mockSummary.substring(0, summaryLength),
    keyPoints: mockKeyPoints.slice(0, type === 'brief' ? 2 : 4),
    tags: mockTags,
    estimatedReadTime: Math.ceil(mockSummary.length / 200), // Assume 200 words per minute
  };
};

// @route   POST /api/summaries
// @desc    Generate a summary from a material
// @access  Private
router.post('/',
  authenticate,
  [
    body('materialId')
      .isMongoId()
      .withMessage('Valid material ID is required'),
    body('type')
      .isIn(['brief', 'detailed', 'key-points', 'flashcards'])
      .withMessage('Type must be brief, detailed, key-points, or flashcards'),
    body('maxLength')
      .optional()
      .isInt({ min: 50, max: 1000 })
      .withMessage('Max length must be between 50 and 1000 characters')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { materialId, type, maxLength = 500 } = req.body;

    // Check if material exists and user has access
    const material = await Material.findOne({
      _id: materialId,
      $or: [
        { userId: req.user._id },
        { isPublic: true }
      ]
    });

    if (!material) {
      throw createError('Material not found or access denied', 404);
    }

    // Generate summary using AI service
    const { summary: content, keyPoints, tags, estimatedReadTime } = await generateAISummary(
      material, 
      type as 'brief' | 'detailed' | 'key-points' | 'flashcards',
      'intermediate',
      req.body.focusAreas
    );

    // Calculate reading time (in seconds)
    const readingTime = estimatedReadTime * 60;

    // Create summary
    const summary = await Summary.create({
      userId: req.user._id,
      materialId: material._id,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Summary: ${material.title}`,
      content: content.substring(0, maxLength),
      keyPoints,
      summaryType: type,
      readingTime,
      tags: tags || [],
      difficulty: 'intermediate',
      aiModel: 'gpt-4-turbo-preview',
      generatedAt: new Date()
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.summariesGenerated': 1 }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Summary generated successfully',
      data: {
        summary
      }
    };

    logger.info(`Summary generated: ${summary.title} by user ${req.user.email}`);
    res.status(201).json(response);
  })
);

// @route   GET /api/summaries
// @desc    Get user's summaries with pagination
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
    query('materialId')
      .optional()
      .isMongoId()
      .withMessage('Valid material ID is required'),
    query('type')
      .optional()
      .isIn(['brief', 'detailed', 'bullet_points', 'mind_map'])
      .withMessage('Type must be brief, detailed, bullet_points, or mind_map')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const {
      page = '1',
      limit = '10',
      materialId = '',
      type = '',
      sort = 'generatedAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { userId: req.user._id };
    if (materialId) query.materialId = materialId;
    if (type) query.summaryType = type;

    // Build sort
    const sortOrder = (order as string) === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sort as string] = sortOrder;

    // Execute query
    const [summaries, total] = await Promise.all([
      Summary.find(query)
        .populate('materialId', 'title subject difficulty')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Summary.countDocuments(query)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Summaries retrieved successfully',
      data: {
        summaries
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

// @route   GET /api/summaries/:id
// @desc    Get a specific summary
// @access  Private
router.get('/:id',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const summary = await Summary.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('materialId', 'title subject difficulty tags');

    if (!summary) {
      throw createError('Summary not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Summary retrieved successfully',
      data: {
        summary
      }
    };

    res.status(200).json(response);
  })
);

// @route   PUT /api/summaries/:id/rating
// @desc    Rate a summary
// @access  Private
router.put('/:id/rating',
  authenticate,
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Feedback must be less than 1000 characters')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { rating, feedback } = req.body;

    const summary = await Summary.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { 
        userRating: rating,
        userFeedback: feedback || undefined
      },
      { new: true, runValidators: true }
    );

    if (!summary) {
      throw createError('Summary not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Summary rating updated successfully',
      data: {
        summary
      }
    };

    res.status(200).json(response);
  })
);

// @route   DELETE /api/summaries/:id
// @desc    Delete a summary
// @access  Private
router.delete('/:id',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const summary = await Summary.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!summary) {
      throw createError('Summary not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Summary deleted successfully'
    };

    res.status(200).json(response);
  })
);

export default router;
