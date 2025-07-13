import { useState, useCallback } from 'react';
import { apiHelper } from '../lib/api';

export interface AIJobStatus {
  id: string;
  type: 'summarization' | 'scheduling' | 'flashcards' | 'quiz' | 'smart-notes' | 'study-plan' | 'universal-analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

export interface SummaryGenerationOptions {
  materialId: string;
  summaryType: 'brief' | 'detailed' | 'key-points' | 'flashcards';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  focusAreas?: string[];
}

export interface ScheduleGenerationOptions {
  materialIds: string[];
  preferences: {
    availableHours: Record<string, { start: string; end: string }[]>;
    preferredSessionLength: number;
    maxSessionsPerDay: number;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    difficultyProgression?: 'linear' | 'adaptive' | 'mixed';
  };
  goals: {
    targetCompletionDate?: string;
    priority: 'speed' | 'retention' | 'balanced';
    reviewFrequency?: 'daily' | 'weekly' | 'bi-weekly';
  };
}

// New AI interfaces according to the prompt specification
export interface Flashcard {
  question: string;
  answer: string;
}

export interface Quiz {
  question: string;
  options: string[];
  answer: string; // one of 'a', 'b', 'c', 'd'
}

export interface Schedule {
  date: string;
  topic: string;
  durationHours: number;
}

export interface FlashcardGenerationOptions {
  topic: string;
  count?: number;
}

export interface QuizGenerationOptions {
  topic: string;
  count?: number;
}

export interface SmartNotesOptions {
  content: string;
}

export interface SimpleScheduleOptions {
  topics: string[];
  totalHours: number;
  startDate: string;
  endDate: string;
}

export interface StudyPlanOptions {
  goal: string;
  availableHours: number;
}

// Universal Learning Analyzer Types
export interface LearningOutput {
  summary: string;
  bulletPoints: string[];
  flashcards: Flashcard[];
  quiz: Quiz[];
  recommendedSchedule: Schedule[];
}

export interface AnalysisOptions {
  includeSchedule?: boolean;
  flashcardCount?: number;
  quizCount?: number;
  summaryLength?: 'short' | 'medium' | 'long';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  scheduleStartDate?: string;
  scheduleEndDate?: string;
  totalStudyHours?: number;
}

export interface TextAnalysisOptions {
  content: string;
  options?: AnalysisOptions;
}

export interface YouTubeAnalysisOptions {
  url: string;
  options?: AnalysisOptions;
}

export interface FileAnalysisOptions {
  file: File;
  options?: AnalysisOptions;
}

export const useAI = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<AIJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiStats, setAIStats] = useState<any>(null);

  // Test AI service connectivity
  const testConnection = useCallback(async () => {
    try {
      setError(null);
      const response = await apiHelper.ai.test();
      return response.data.connected;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // Generate AI summary
  const generateSummary = useCallback(async (options: SummaryGenerationOptions) => {
    try {
      console.log('🔍 Starting generateSummary function');
      console.log('🔍 Options received:', options);
      
      // First, test AI connection
      try {
        console.log('🔍 Testing AI connection...');
        const connectionTest = await apiHelper.ai.test();
        console.log('🔍 AI connection test result:', connectionTest);
      } catch (connectionError) {
        console.log('🚫 AI connection test failed:', connectionError);
      }
      
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      // Use demo endpoint for sample materials, regular endpoint for others
      const isDemo = options.materialId.startsWith('sample-material-');
      
      console.log('🔍 CRITICAL DEBUG:');
      console.log('🔍 materialId:', JSON.stringify(options.materialId));
      console.log('🔍 materialId type:', typeof options.materialId);
      console.log('🔍 materialId.startsWith check:', options.materialId.startsWith('sample-material-'));
      console.log('🔍 isDemo result:', isDemo);
      
      if (isDemo) {
        console.log('🔍 About to call demo endpoint');
        console.log('🔍 API base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
        
        // For demo materials, use the AI demo endpoint
        const response = await apiHelper.ai.demo.generateSummary(options);
        console.log('🔍 Demo response received:', response);
        const jobId = response.data.jobId;

        // Start polling for job status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await apiHelper.ai.demo.getJobStatus(jobId);
            const status = statusResponse.data as AIJobStatus;
            setJobStatus(status);

            if (status.status === 'completed' || status.status === 'failed') {
              clearInterval(pollInterval);
              setIsGenerating(false);
            }
          } catch (pollError: any) {
            console.error('Error polling job status:', pollError);
            clearInterval(pollInterval);
            setIsGenerating(false);
            setError('Failed to check job status');
          }
        }, 2000); // Poll every 2 seconds

        // Clear interval after 5 minutes to prevent infinite polling
        setTimeout(() => {
          clearInterval(pollInterval);
          if (isGenerating) {
            setIsGenerating(false);
            setError('Summary generation timed out');
          }
        }, 5 * 60 * 1000);

        return jobId;
      } else {
        // For real materials, directly call the summary API
        // Map our summary types to the backend expected types
        const typeMapping = {
          'brief': 'brief',
          'detailed': 'detailed', 
          'key-points': 'key-points', // Keep as key-points for AI bot
          'flashcards': 'flashcards'  // Keep as flashcards for AI bot
        };
        
        const mappedType = typeMapping[options.summaryType] || 'detailed';
        console.log('🔍 Mapping summaryType:', options.summaryType, '→', mappedType);
          const response = await apiHelper.summary.generate(options.materialId, {
          type: mappedType,
          focusAreas: options.focusAreas,
          difficulty: options.difficulty
        });

        console.log('🔍 Summary API response:', response);

        // Simulate job completion for consistency
        const mockStatus: AIJobStatus = {
          id: Date.now().toString(),
          type: 'summarization',
          status: 'completed',
          progress: 100,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          result: (response as any).data?.summary || response
        };

        console.log('🔍 Mock status created:', mockStatus);
        setJobStatus(mockStatus);
        setIsGenerating(false);

        return mockStatus.id;
      }
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  // Generate AI schedule
  const generateSchedule = useCallback(async (options: ScheduleGenerationOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      const response = await apiHelper.ai.generateSchedule(options);
      const jobId = response.data.jobId;

      // Start polling for job status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiHelper.ai.getJobStatus(jobId);
          const status = statusResponse.data as AIJobStatus;
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
          }
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError('Failed to check job status');
        }
      }, 2000); // Poll every 2 seconds

      // Clear interval after 5 minutes to prevent infinite polling
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('Schedule generation timed out');
        }
      }, 5 * 60 * 1000);

      return jobId;
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  // Get job status manually
  const checkJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await apiHelper.ai.getJobStatus(jobId);
      const status = response.data as AIJobStatus;
      setJobStatus(status);
      return status;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Get AI usage statistics
  const getAIStats = useCallback(async () => {
    try {
      setError(null);
      const response = await apiHelper.ai.getStats();
      setAIStats(response.data);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear job status
  const clearJobStatus = useCallback(() => {
    setJobStatus(null);
  }, []);

  // Generate flashcards
  const generateFlashcards = useCallback(async (options: FlashcardGenerationOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      const response = await apiHelper.ai.generateFlashcards(options);
      const jobId = response.data.jobId;

      // Start polling for job status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiHelper.ai.getJobStatus(jobId);
          const status = statusResponse.data as AIJobStatus;
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
          }
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError('Failed to check job status');
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('Flashcard generation timed out');
        }
      }, 5 * 60 * 1000);

      return jobId;
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  // Generate quiz
  const generateQuiz = useCallback(async (options: QuizGenerationOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      const response = await apiHelper.ai.generateQuiz(options);
      const jobId = response.data.jobId;

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiHelper.ai.getJobStatus(jobId);
          const status = statusResponse.data as AIJobStatus;
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
          }
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError('Failed to check job status');
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('Quiz generation timed out');
        }
      }, 5 * 60 * 1000);

      return jobId;
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  // Generate smart notes
  const generateSmartNotes = useCallback(async (options: SmartNotesOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      const response = await apiHelper.ai.generateSmartNotes(options);
      const jobId = response.data.jobId;

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiHelper.ai.getJobStatus(jobId);
          const status = statusResponse.data as AIJobStatus;
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
          }
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError('Failed to check job status');
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('Smart notes generation timed out');
        }
      }, 5 * 60 * 1000);

      return jobId;
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  // Generate simple schedule
  const generateSimpleSchedule = useCallback(async (options: SimpleScheduleOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      const response = await apiHelper.ai.generateSimpleSchedule(options);
      const jobId = response.data.jobId;

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiHelper.ai.getJobStatus(jobId);
          const status = statusResponse.data as AIJobStatus;
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
          }
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError('Failed to check job status');
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('Schedule generation timed out');
        }
      }, 5 * 60 * 1000);

      return jobId;
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  // Generate study plan
  const generateStudyPlan = useCallback(async (options: StudyPlanOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      const response = await apiHelper.ai.generateStudyPlan(options);
      const jobId = response.data.jobId;

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiHelper.ai.getJobStatus(jobId);
          const status = statusResponse.data as AIJobStatus;
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
          }
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError('Failed to check job status');
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('Study plan generation timed out');
        }
      }, 5 * 60 * 1000);

      return jobId;
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  // Universal Learning Analyzer functions
  
  /**
   * Analyze text content and generate comprehensive learning materials
   */
  const analyzeText = useCallback(async (options: TextAnalysisOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      const response = await apiHelper.ai.analyzeText(options);
      const jobId = response.data.jobId;

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiHelper.ai.getJobStatus(jobId);
          const status = statusResponse.data as AIJobStatus;
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
          }
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError('Failed to check job status');
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('Text analysis timed out');
        }
      }, 10 * 60 * 1000); // 10 minutes timeout for comprehensive analysis

      return jobId;
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  /**
   * Analyze YouTube video and generate comprehensive learning materials
   */
  const analyzeYouTube = useCallback(async (options: YouTubeAnalysisOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      const response = await apiHelper.ai.analyzeYouTube(options);
      const jobId = response.data.jobId;

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiHelper.ai.getJobStatus(jobId);
          const status = statusResponse.data as AIJobStatus;
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
          }
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError('Failed to check job status');
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('YouTube analysis timed out');
        }
      }, 15 * 60 * 1000); // 15 minutes timeout for video processing

      return jobId;
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  /**
   * Analyze uploaded file and generate comprehensive learning materials
   */
  const analyzeFile = useCallback(async (options: FileAnalysisOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJobStatus(null);

      const response = await apiHelper.ai.analyzeFile(options.file, options.options);
      const jobId = response.data.jobId;

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await apiHelper.ai.getJobStatus(jobId);
          const status = statusResponse.data as AIJobStatus;
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
          }
        } catch (pollError: any) {
          console.error('Error polling job status:', pollError);
          clearInterval(pollInterval);
          setIsGenerating(false);
          setError('Failed to check job status');
        }
      }, 3000);

      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          setError('File analysis timed out');
        }
      }, 20 * 60 * 1000); // 20 minutes timeout for file processing

      return jobId;
    } catch (err: any) {
      setIsGenerating(false);
      setError(err.message);
      throw err;
    }
  }, [isGenerating]);

  return {
    // State
    isGenerating,
    jobStatus,
    error,
    aiStats,

    // Actions
    testConnection,
    generateSummary,
    generateSchedule,
    generateFlashcards,
    generateQuiz,
    generateSmartNotes,
    generateSimpleSchedule,
    generateStudyPlan,
    analyzeText,
    analyzeYouTube,
    analyzeFile,
    checkJobStatus,
    getAIStats,
    clearError,
    clearJobStatus,

    // Computed values
    isJobCompleted: jobStatus?.status === 'completed',
    isJobFailed: jobStatus?.status === 'failed',
    jobProgress: jobStatus?.progress || 0,
    jobResult: jobStatus?.result,
    jobError: jobStatus?.error?.message,
  };
};

// Utility function to create default schedule preferences
export const createDefaultSchedulePreferences = () => ({
  availableHours: {
    Monday: [{ start: '09:00', end: '17:00' }],
    Tuesday: [{ start: '09:00', end: '17:00' }],
    Wednesday: [{ start: '09:00', end: '17:00' }],
    Thursday: [{ start: '09:00', end: '17:00' }],
    Friday: [{ start: '09:00', end: '17:00' }],
    Saturday: [{ start: '10:00', end: '16:00' }],
    Sunday: [{ start: '10:00', end: '16:00' }],
  },
  preferredSessionLength: 60,
  maxSessionsPerDay: 3,
  learningStyle: 'reading' as const,
  difficultyProgression: 'adaptive' as const,
});

// Utility function to create default schedule goals
export const createDefaultScheduleGoals = () => ({
  priority: 'balanced' as const,
  reviewFrequency: 'weekly' as const,
});

export default useAI;
