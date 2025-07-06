import type { Request } from 'express';
import type { Document, ObjectId } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    studyReminders: boolean;
    emailUpdates: boolean;
  };
  stats: {
    totalStudyTime: number;
    materialsUploaded: number;
    summariesGenerated: number;
    quizzesCompleted: number;
    averageScore: number;
  };
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
  isActive: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Material Types
export interface IMaterial extends Document {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  content: string;
  type: 'pdf' | 'docx' | 'txt' | 'manual';
  filename?: string;
  originalName?: string;
  size?: number;
  metadata: {
    pages?: number;
    wordCount: number;
    readingTime: number;
    language: string;
    extractedImages?: number;
  };
  tags: string[];
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPublic: boolean;
  uploadedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
}

// Summary Types
export interface ISummary extends Document {
  _id: ObjectId;
  userId: ObjectId;
  materialId: ObjectId;
  title: string;
  content: string;
  keyPoints: string[];
  summaryType: 'brief' | 'detailed' | 'key-points' | 'flashcards';
  generatedAt: Date;
  readingTime: number;
  aiModel: string;
  userRating?: number;
  userFeedback?: string;
}

// Schedule Types
export interface IScheduleItem extends Document {
  _id: ObjectId;
  userId: ObjectId;
  materialId?: ObjectId;
  summaryId?: ObjectId;
  title: string;
  description?: string;
  type: 'study' | 'review' | 'quiz' | 'break' | 'deadline';
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  reminders: {
    time: Date;
    sent: boolean;
  }[];
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
  completedAt?: Date;
  actualDuration?: number;
}

// Quiz Types
export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
}

export interface IQuiz extends Document {
  _id: ObjectId;
  userId: ObjectId;
  materialId?: ObjectId;
  title: string;
  description?: string;
  questions: IQuizQuestion[];
  timeLimit?: number;
  passingScore: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  subject: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalAttempts: number;
  averageScore: number;
}

export interface IQuizAttempt extends Document {
  _id: ObjectId;
  userId: ObjectId;
  quizId: ObjectId;
  answers: number[];
  score: number;
  percentage: number;
  timeSpent: number;
  completedAt: Date;
  correctAnswers: number;
  incorrectAnswers: number;
  passed: boolean;
}

// API Types
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  file?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface MaterialQuery extends PaginationQuery {
  search?: string;
  subject?: string;
  type?: string;
  difficulty?: string;
  tags?: string;
}

export interface AnalyticsData {
  studyTime: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    total: number;
  };
  performance: {
    averageScore: number;
    improvement: number;
    strongSubjects: string[];
    weakSubjects: string[];
  };
  materials: {
    totalUploaded: number;
    byType: Record<string, number>;
    bySubject: Record<string, number>;
  };
  quizzes: {
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
  };
}

// File Upload Types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// AI Service Types
export interface SummaryRequest {
  content: string;
  type: 'brief' | 'detailed' | 'bullet_points' | 'mind_map';
  maxLength?: number;
}

export interface QuizGenerationRequest {
  content: string;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  subject: string;
}

export interface AIInsight {
  type: 'strength' | 'weakness' | 'recommendation' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
}

// Error Types
export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}
