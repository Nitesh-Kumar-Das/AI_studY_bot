import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { Quiz, QuizAttempt } from '@/models/Quiz';
import { Material } from '@/models/Material';
import { User } from '@/models/User';
import { authenticate } from '@/middleware/auth';
import { catchAsync, createError } from '@/middleware/errorHandler';
import { ApiResponse, AuthenticatedRequest, IQuizQuestion } from '@/types';
import { logger } from '@/utils/logger';

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

// Mock AI service for quiz generation
const generateQuizQuestions = async (
  content: string, 
  questionCount: number, 
  difficulty: string,
  subject: string
): Promise<IQuizQuestion[]> => {
  // This is a mock implementation
  // In a real app, you would integrate with OpenAI or another AI service
  const mockQuestions: IQuizQuestion[] = [
    {
      question: "What is the main topic of this study material?",
      options: [
        "Basic concepts and fundamentals",
        "Advanced theoretical frameworks",
        "Practical applications only",
        "Historical background"
      ],
      correctAnswer: 0,
      explanation: "The material focuses on foundational concepts that are essential for understanding the subject.",
      difficulty: "easy",
      category: subject,
      points: 1
    },
    {
      question: "Which approach is most effective for applying these concepts?",
      options: [
        "Memorization without understanding",
        "Practical application with theoretical backing",
        "Purely theoretical study",
        "Random experimentation"
      ],
      correctAnswer: 1,
      explanation: "Combining practical application with solid theoretical understanding provides the best learning outcomes.",
      difficulty: "medium",
      category: subject,
      points: 2
    },
    {
      question: "What are the key challenges in mastering this subject?",
      options: [
        "Lack of real-world examples",
        "Complex interconnected concepts",
        "Limited study resources",
        "All of the above"
      ],
      correctAnswer: 3,
      explanation: "Mastering any subject involves multiple challenges including conceptual complexity, resource availability, and practical application.",
      difficulty: "hard",
      category: subject,
      points: 3
    }
  ];

  // Adjust difficulty distribution based on request
  const questions = mockQuestions.slice(0, Math.min(questionCount, mockQuestions.length));
  
  // Repeat questions if needed to reach desired count
  while (questions.length < questionCount) {
    const additionalQuestion = {
      ...mockQuestions[questions.length % mockQuestions.length],
      question: `Question ${questions.length + 1}: ${mockQuestions[questions.length % mockQuestions.length].question}`
    };
    questions.push(additionalQuestion);
  }

  return questions;
};

// @route   POST /api/quizzes/generate
// @desc    Generate a quiz from a material
// @access  Private
router.post('/generate',
  authenticate,
  [
    body('materialId')
      .isMongoId()
      .withMessage('Valid material ID is required'),
    body('questionCount')
      .isInt({ min: 1, max: 50 })
      .withMessage('Question count must be between 1 and 50'),
    body('difficulty')
      .isIn(['easy', 'medium', 'hard', 'mixed'])
      .withMessage('Difficulty must be easy, medium, hard, or mixed'),
    body('timeLimit')
      .optional()
      .isInt({ min: 60, max: 7200 })
      .withMessage('Time limit must be between 1 minute and 2 hours'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be less than 200 characters')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { 
      materialId, 
      questionCount, 
      difficulty, 
      timeLimit = 600,
      title 
    } = req.body;

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

    // Generate quiz questions using AI service
    const questions = await generateQuizQuestions(
      material.content, 
      questionCount, 
      difficulty,
      material.subject
    );

    // Create quiz
    const quiz = await Quiz.create({
      userId: req.user._id,
      materialId: material._id,
      title: title || `Quiz: ${material.title}`,
      description: `AI-generated quiz based on ${material.title}`,
      questions,
      timeLimit,
      passingScore: 70,
      difficulty,
      subject: material.subject,
      tags: material.tags,
      isPublic: false,
      totalAttempts: 0,
      averageScore: 0
    });

    const response: ApiResponse = {
      success: true,
      message: 'Quiz generated successfully',
      data: {
        quiz
      }
    };

    logger.info(`Quiz generated: ${quiz.title} by user ${req.user.email}`);
    res.status(201).json(response);
  })
);

// @route   GET /api/quizzes
// @desc    Get user's quizzes with pagination
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
    query('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard', 'mixed'])
      .withMessage('Difficulty must be easy, medium, hard, or mixed'),
    query('subject')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Subject must be less than 100 characters')
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
      difficulty = '',
      subject = '',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { 
      $or: [
        { userId: req.user._id },
        { isPublic: true }
      ]
    };
    
    if (materialId) query.materialId = materialId;
    if (difficulty) query.difficulty = difficulty;
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    // Build sort
    const sortOrder = (order as string) === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sort as string] = sortOrder;

    // Execute query
    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate('materialId', 'title subject difficulty')
        .select('-questions') // Exclude questions from list view
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Quiz.countDocuments(query)
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Quizzes retrieved successfully',
      data: {
        quizzes
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

// @route   GET /api/quizzes/:id
// @desc    Get a specific quiz with questions
// @access  Private
router.get('/:id',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { isPublic: true }
      ]
    }).populate('materialId', 'title subject difficulty tags');

    if (!quiz) {
      throw createError('Quiz not found or access denied', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Quiz retrieved successfully',
      data: {
        quiz
      }
    };

    res.status(200).json(response);
  })
);

// @route   POST /api/quizzes/:id/attempt
// @desc    Submit a quiz attempt
// @access  Private
router.post('/:id/attempt',
  authenticate,
  [
    body('answers')
      .isArray({ min: 1 })
      .withMessage('Answers array is required'),
    body('answers.*')
      .isInt({ min: 0 })
      .withMessage('Each answer must be a non-negative integer'),
    body('timeSpent')
      .isInt({ min: 0 })
      .withMessage('Time spent must be a non-negative integer')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { answers, timeSpent } = req.body;

    // Get quiz
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { isPublic: true }
      ]
    });

    if (!quiz) {
      throw createError('Quiz not found or access denied', 404);
    }

    // Validate answer count
    if (answers.length !== quiz.questions.length) {
      throw createError('Answer count must match question count', 400);
    }

    // Calculate score
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach((question, index) => {
      totalPoints += question.points;
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
        earnedPoints += question.points;
      }
    });

    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const passed = percentage >= quiz.passingScore;

    // Create quiz attempt
    const attempt = await QuizAttempt.create({
      userId: req.user._id,
      quizId: quiz._id,
      answers,
      score: earnedPoints,
      percentage,
      timeSpent,
      correctAnswers,
      incorrectAnswers: quiz.questions.length - correctAnswers,
      passed,
      completedAt: new Date()
    });

    // Update quiz statistics
    const allAttempts = await QuizAttempt.find({ quizId: quiz._id });
    const totalAttempts = allAttempts.length;
    const averageScore = allAttempts.reduce((sum, att) => sum + att.percentage, 0) / totalAttempts;

    await Quiz.findByIdAndUpdate(quiz._id, {
      totalAttempts,
      averageScore: Math.round(averageScore)
    });

    // Update user stats
    const userAttempts = await QuizAttempt.find({ userId: req.user._id });
    const userAverageScore = userAttempts.reduce((sum, att) => sum + att.percentage, 0) / userAttempts.length;

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.quizzesCompleted': 1 },
      $set: { 'stats.averageScore': Math.round(userAverageScore) }
    });

    const response: ApiResponse = {
      success: true,
      message: 'Quiz attempt submitted successfully',
      data: {
        attempt,
        results: {
          score: earnedPoints,
          totalPoints,
          percentage,
          correctAnswers,
          incorrectAnswers: quiz.questions.length - correctAnswers,
          passed,
          timeSpent
        }
      }
    };

    logger.info(`Quiz attempt completed: ${quiz.title} by user ${req.user.email} - Score: ${percentage}%`);
    res.status(201).json(response);
  })
);

// @route   GET /api/quizzes/:id/attempts
// @desc    Get user's attempts for a specific quiz
// @access  Private
router.get('/:id/attempts',
  authenticate,
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const attempts = await QuizAttempt.find({
      quizId: req.params.id,
      userId: req.user._id
    }).sort({ completedAt: -1 });

    const response: ApiResponse = {
      success: true,
      message: 'Quiz attempts retrieved successfully',
      data: {
        attempts
      }
    };

    res.status(200).json(response);
  })
);

export default router;
