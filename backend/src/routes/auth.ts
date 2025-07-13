import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '@/models/User';
import { generateToken, authenticate } from '@/middleware/auth';
import { catchAsync, createError } from '@/middleware/errorHandler';
import { ApiResponse, AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

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

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!handleValidationErrors(req, res)) return;

  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const response: ApiResponse = {
      success: false,
      message: 'User already exists with this email',
      error: 'USER_EXISTS'
    };
    res.status(400).json(response);
    return;
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    preferences: {
      theme: 'system',
      notifications: true,
      studyReminders: true,
      emailUpdates: false
    },
    stats: {
      totalStudyTime: 0,
      materialsUploaded: 0,
      summariesGenerated: 0,
      quizzesCompleted: 0,
      averageScore: 0
    },
    achievements: [],
    lastActive: new Date(),
    isActive: true
  });

  // Generate token
  const token = generateToken(user._id.toString());

  // Remove password from response
  const userResponse = user.toObject();
  const { password: _, ...userWithoutPassword } = userResponse;

  const response: ApiResponse = {
    success: true,
    message: 'User registered successfully',
    data: {
      user: userWithoutPassword,
      token
    }
  };

  logger.info(`New user registered: ${email}`);
  res.status(201).json(response);
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!handleValidationErrors(req, res)) return;

  const { email, password } = req.body;

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid email or password',
      error: 'INVALID_CREDENTIALS'
    };
    res.status(401).json(response);
    return;
  }

  // Check password
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid email or password',
      error: 'INVALID_CREDENTIALS'
    };
    res.status(401).json(response);
    return;
  }

  // Update last active
  user.lastActive = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = generateToken(user._id.toString());

  // Remove password from response
  const userResponse = user.toObject();
  const { password: _, ...userWithoutPassword } = userResponse;

  const response: ApiResponse = {
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token
    }
  };

  logger.info(`User logged in: ${email}`);
  res.status(200).json(response);
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw createError('User not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    message: 'User retrieved successfully',
    data: {
      user: req.user
    }
  };

  res.status(200).json(response);
}));

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { name, email } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        const response: ApiResponse = {
          success: false,
          message: 'Email is already taken',
          error: 'EMAIL_TAKEN'
        };
        res.status(400).json(response);
        return;
      }
      updateData.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    };

    res.status(200).json(response);
  })
);

// @route   PUT /api/auth/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', 
  authenticate,
  [
    body('theme')
      .optional()
      .isIn(['light', 'dark', 'system'])
      .withMessage('Theme must be light, dark, or system'),
    body('notifications')
      .optional()
      .isBoolean()
      .withMessage('Notifications must be a boolean'),
    body('studyReminders')
      .optional()
      .isBoolean()
      .withMessage('Study reminders must be a boolean'),
    body('emailUpdates')
      .optional()
      .isBoolean()
      .withMessage('Email updates must be a boolean')
  ],
  catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!handleValidationErrors(req, res)) return;
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { theme, notifications, studyReminders, emailUpdates } = req.body;
    const preferences: any = {};

    if (theme !== undefined) preferences.theme = theme;
    if (notifications !== undefined) preferences.notifications = notifications;
    if (studyReminders !== undefined) preferences.studyReminders = studyReminders;
    if (emailUpdates !== undefined) preferences.emailUpdates = emailUpdates;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'preferences': { ...req.user.preferences, ...preferences } } },
      { new: true, runValidators: true }
    );

    const response: ApiResponse = {
      success: true,
      message: 'Preferences updated successfully',
      data: {
        user: updatedUser
      }
    };

    res.status(200).json(response);
  })
);

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticate, catchAsync(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const response: ApiResponse = {
    success: true,
    message: 'Logout successful'
  };

  res.status(200).json(response);
}));

// @route   POST /api/auth/signup
// @desc    Sign up a new user (alias for register)
// @access  Public
router.post('/signup', registerValidation, catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!handleValidationErrors(req, res)) return;

  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const response: ApiResponse = {
      success: false,
      message: 'User already exists with this email',
      error: 'USER_EXISTS'
    };
    res.status(400).json(response);
    return;
  }

  // Create new user - password will be automatically hashed by the pre-save middleware
  const user = await User.create({
    name,
    email,
    password, // This will be hashed automatically
    preferences: {
      theme: 'system',
      notifications: true,
      studyReminders: true,
      emailUpdates: false
    },
    stats: {
      totalStudyTime: 0,
      materialsUploaded: 0,
      summariesGenerated: 0,
      quizzesCompleted: 0,
      averageScore: 0
    },
    achievements: [],
    lastActive: new Date(),
    isActive: true
  });

  // Generate JWT token
  const token = generateToken(user._id.toString());

  // Remove password from response for security
  const userResponse = user.toObject();
  const { password: _, ...userWithoutPassword } = userResponse;

  const response: ApiResponse = {
    success: true,
    message: 'User signed up successfully',
    data: {
      user: userWithoutPassword,
      token
    }
  };

  logger.info(`New user signed up: ${email}`);
  res.status(201).json(response);
}));

export default router;
