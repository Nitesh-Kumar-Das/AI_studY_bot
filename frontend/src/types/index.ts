// Common types for the AI Study App

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface StudyMaterial {
  id: string;
  title: string;
  content: string;
  type: 'pdf' | 'text' | 'video' | 'audio';
  uploadedAt: Date;
  userId: string;
  filename?: string; // Optional filename for uploaded files
}

export interface StudySchedule {
  id: string;
  title: string;
  description: string;
  scheduledDate: Date;
  duration: number; // in minutes
  completed: boolean;
  userId: string;
  materialId?: string;
}

export interface StudySummary {
  id: string;
  title: string;
  content: string;
  materialId: string;
  createdAt: Date;
  userId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// AI Processing Types
export interface AIProcessingStatus {
  id: string;
  type: 'summarization' | 'scheduling' | 'flashcards' | 'quiz' | 'smart-notes' | 'study-plan' | 'universal-analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
  };
}

export interface LearningOutput {
  summary: string;
  bulletPoints: string[];
  flashcards: Array<{ question: string; answer: string }>;
  quiz: Array<{ question: string; options: string[]; answer: string }>;
  recommendedSchedule: Array<{ date: string; topic: string; durationHours: number }>;
}

export type InputSource = 'text' | 'pdf' | 'docx' | 'image' | 'youtube';

export interface AnalysisRequest {
  content?: string;
  url?: string;
  options: {
    flashcardCount?: number;
    quizCount?: number;
    summaryLength?: 'short' | 'medium' | 'long';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    includeSchedule?: boolean;
    totalStudyHours?: number;
  };
}

export interface AnalysisResponse {
  jobId: string;
  status: AIProcessingStatus;
}
