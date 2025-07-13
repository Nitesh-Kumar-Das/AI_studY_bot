// Input/Output interfaces for AI bot functionality

export interface MaterialContent {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'video' | 'audio' | 'text';
  metadata?: {
    pageCount?: number;
    duration?: number;
    fileSize?: number;
    uploadedAt: Date;
  };
}

// New types according to the prompt specification
export type Flashcard = {
  question: string;
  answer: string;
};

export type Quiz = {
  question: string;
  options: string[];
  answer: string; // one of 'a', 'b', 'c', 'd'
};

export type Schedule = {
  date: string;
  topic: string;
  durationHours: number;
};

// AI Universal Learning Analyzer Types
export type LearningOutput = {
  summary: string;
  bulletPoints: string[];
  flashcards: Flashcard[];
  quiz: Quiz[];
  recommendedSchedule: Schedule[];
};

export interface InputSource {
  type: 'text' | 'pdf' | 'docx' | 'image' | 'youtube';
  content?: string;
  buffer?: Buffer;
  filePath?: string;
  url?: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    uploadedAt?: Date;
    extractedText?: string;
    processingTime?: number;
  };
}

export interface AnalysisRequest {
  source: InputSource;
  options?: {
    includeSchedule?: boolean;
    flashcardCount?: number;
    quizCount?: number;
    summaryLength?: 'short' | 'medium' | 'long';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    scheduleStartDate?: string;
    scheduleEndDate?: string;
    totalStudyHours?: number;
  };
}

export interface AnalysisResponse {
  id: string;
  inputType: InputSource['type'];
  result: LearningOutput;
  metadata: {
    processingTime: number;
    extractedTextLength: number;
    aiModel: string;
    generatedAt: Date;
    sourceMetadata?: any;
  };
}

export interface SummaryRequest {
  material: MaterialContent;
  summaryType: 'brief' | 'detailed' | 'key-points' | 'flashcards';
  targetLength?: 'short' | 'medium' | 'long';
  focusAreas?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SummaryResponse {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // in minutes
  materialId: string;
  createdAt: Date;
  metadata: {
    originalLength: number;
    summaryLength: number;
    compressionRatio: number;
    aiModel: string;
    processingTime: number;
  };
}

export interface ScheduleRequest {
  materials: MaterialContent[];
  userPreferences: {
    availableHours: {
      [day: string]: { start: string; end: string }[];
    };
    preferredSessionLength: number; // in minutes
    maxSessionsPerDay: number;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    difficultyProgression: 'linear' | 'adaptive' | 'mixed';
  };
  goals: {
    targetCompletionDate?: Date;
    priority: 'speed' | 'retention' | 'balanced';
    reviewFrequency: 'daily' | 'weekly' | 'bi-weekly';
  };
  existingSchedule?: ScheduledSession[];
}

export interface ScheduledSession {
  id: string;
  materialId: string;
  title: string;
  description: string;
  scheduledDate: Date;
  duration: number; // in minutes
  sessionType: 'study' | 'review' | 'practice' | 'assessment';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  priority: 'high' | 'medium' | 'low';
  prerequisites?: string[];
  estimatedEffort: 'light' | 'moderate' | 'intensive';
  completed: boolean;
  completedAt?: Date;
  actualDuration?: number;
  userRating?: number; // 1-5 scale
  notes?: string;
}

export interface ScheduleResponse {
  schedule: ScheduledSession[];
  recommendations: {
    totalEstimatedTime: number; // in hours
    suggestedStartDate: Date;
    completionDate: Date;
    weeklyTimeCommitment: number; // in hours
    suggestions: string[];
  };
  analytics: {
    materialDistribution: { [materialId: string]: number };
    difficultyProgression: { [week: number]: 'beginner' | 'intermediate' | 'advanced' };
    sessionTypeDistribution: { [type: string]: number };
  };
  metadata: {
    aiModel: string;
    generatedAt: Date;
    processingTime: number;
    confidence: number; // 0-1 scale
  };
}

export interface AIBotError {
  code: 'INVALID_INPUT' | 'AI_SERVICE_ERROR' | 'RATE_LIMIT' | 'AUTHENTICATION_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface AIProcessingStatus {
  id: string;
  type: 'summarization' | 'scheduling' | 'flashcards' | 'quiz' | 'smart-notes' | 'study-plan' | 'universal-analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  result?: SummaryResponse | ScheduleResponse | Flashcard[] | Quiz[] | string[] | LearningOutput | any;
  error?: AIBotError;
}

// Utility types
export type SummaryType = SummaryRequest['summaryType'];
export type TargetLength = NonNullable<SummaryRequest['targetLength']>;
export type Difficulty = SummaryResponse['difficulty'];
export type SessionType = ScheduledSession['sessionType'];
export type Priority = ScheduledSession['priority'];
export type LearningStyle = ScheduleRequest['userPreferences']['learningStyle'];

// Validation schemas (can be used with libraries like Joi or Zod)
export interface ValidationSchema {
  material: {
    maxContentLength: number;
    allowedTypes: string[];
    maxFileSize: number; // in bytes
  };
  summary: {
    minContentLength: number;
    maxFocusAreas: number;
    allowedSummaryTypes: SummaryType[];
  };
  schedule: {
    maxMaterials: number;
    maxSessionsPerDay: number;
    maxSessionDuration: number; // in minutes
    minSessionDuration: number; // in minutes
  };
}

export const DEFAULT_VALIDATION: ValidationSchema = {
  material: {
    maxContentLength: 100000, // 100k characters
    allowedTypes: ['pdf', 'video', 'audio', 'text'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  summary: {
    minContentLength: 100,
    maxFocusAreas: 5,
    allowedSummaryTypes: ['brief', 'detailed', 'key-points', 'flashcards'],
  },
  schedule: {
    maxMaterials: 20,
    maxSessionsPerDay: 6,
    maxSessionDuration: 180, // 3 hours
    minSessionDuration: 15, // 15 minutes
  },
};
