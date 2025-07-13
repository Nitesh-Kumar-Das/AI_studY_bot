import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🔍 API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
      headers: config.headers
    });
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log('🚫 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common responses
api.interceptors.response.use(
  (response) => {
    console.log('🔍 API Response success:', {
      status: response.status,
      data: response.data,
      url: response.config.url
    });
    return response.data;
  },
  (error) => {
    console.log('🚫 API Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      message: error.message
    });
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// API helper functions
export const apiHelper = {
  // User endpoints
  auth: {
    login: (credentials: { email: string; password: string }) =>
      api.post('/auth/login', credentials),
    register: (userData: { name: string; email: string; password: string }) =>
      api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
  },

  // Study materials endpoints
  materials: {
    getAll: () => api.get('/materials'),
    getById: (id: string) => api.get(`/materials/${id}`),
    upload: (formData: FormData) => api.post('/materials/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    youtube: (data: { url: string; title: string; subject: string; difficulty: string }) =>
      api.post('/materials/youtube', data),
    delete: (id: string) => api.delete(`/materials/${id}`),
  },

  // Schedule endpoints
  schedule: {
    getAll: () => api.get('/schedule'),
    create: (scheduleData: Record<string, unknown>) => api.post('/schedule', scheduleData),
    update: (id: string, scheduleData: Record<string, unknown>) => api.put(`/schedule/${id}`, scheduleData),
    delete: (id: string) => api.delete(`/schedule/${id}`),
    markComplete: (id: string) => api.patch(`/schedule/${id}/complete`),
  },

  // Summary endpoints
  summary: {
    getAll: () => api.get('/summaries'),
    getByMaterial: (materialId: string) => api.get(`/summaries?materialId=${materialId}`),
    generate: (materialId: string, options?: Record<string, unknown>) => 
      api.post(`/summaries`, { materialId, ...options }),
    delete: (id: string) => api.delete(`/summaries/${id}`),
  },

  // Quiz endpoints
  quiz: {
    getAll: () => api.get('/quiz'),
    getById: (id: string) => api.get(`/quiz/${id}`),
    generate: (materialId: string, options?: Record<string, unknown>) => 
      api.post(`/quiz/generate`, { materialId, ...options }),
    submit: (quizId: string, answers: Record<string, unknown>) => 
      api.post(`/quiz/${quizId}/submit`, { answers }),
    getAttempts: (quizId?: string) => api.get(`/quiz/attempts${quizId ? `?quizId=${quizId}` : ''}`),
    delete: (id: string) => api.delete(`/quiz/${id}`),
  },

  // Analytics endpoints
  analytics: {
    getDashboard: () => api.get('/analytics/dashboard'),
    getStudy: () => api.get('/analytics/study'),
    getPerformance: () => api.get('/analytics/performance'),
    getInsights: () => api.get('/analytics/insights'),
    getSubjects: () => api.get('/analytics/subjects'),
  },

  // User endpoints
  user: {
    getProfile: () => api.get('/users/profile'),
    updateProfile: (data: Record<string, unknown>) => api.put('/users/profile', data),
    getPreferences: () => api.get('/users/preferences'),
    updatePreferences: (data: Record<string, unknown>) => api.put('/users/preferences', data),
    getStats: () => api.get('/users/stats'),
    getAchievements: () => api.get('/users/achievements'),
    deactivateAccount: () => api.delete('/users/account'),
    reactivateAccount: () => api.patch('/users/account/reactivate'),
  },

  // AI endpoints
  ai: {
    health: () => api.get('/ai/health'),
    test: () => api.get('/ai/test'),
    generateSummary: (options: {
      materialId: string;
      summaryType: 'brief' | 'detailed' | 'key-points' | 'flashcards';
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      focusAreas?: string[];
    }) => api.post('/ai/summary/generate', options),
    generateSchedule: (options: {
      materialIds: string[];
      preferences: Record<string, unknown>;
      goals: Record<string, unknown>;
    }) => api.post('/ai/schedule/generate', options),
    
    // New AI features according to the prompt specification
    generateFlashcards: (options: {
      topic: string;
      count?: number;
    }) => api.post('/ai/flashcards/generate', options),
    
    generateQuiz: (options: {
      topic: string;
      count?: number;
    }) => api.post('/ai/quiz/generate', options),
    
    generateSmartNotes: (options: {
      content: string;
    }) => api.post('/ai/notes/generate', options),
    
    generateSimpleSchedule: (options: {
      topics: string[];
      totalHours: number;
      startDate: string;
      endDate: string;
    }) => api.post('/ai/schedule/generate', options),
    
    generateStudyPlan: (options: {
      goal: string;
      availableHours: number;
    }) => api.post('/ai/study-plan/generate', options),
    
    // Universal Learning Analyzer endpoints
    analyzeText: (options: {
      content: string;
      options?: any;
    }) => api.post('/ai/analyze/text', options),
    
    analyzeYouTube: (options: {
      url: string;
      options?: any;
    }) => api.post('/ai/analyze/youtube', options),
    
    analyzeFile: (file: File, options?: any) => {
      const formData = new FormData();
      formData.append('file', file);
      if (options) {
        formData.append('options', JSON.stringify(options));
      }
      return api.post('/ai/analyze/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    
    getJobStatus: (jobId: string) => api.get(`/ai/job/${jobId}`),
    getStats: () => api.get('/ai/stats'),
    
    // Demo endpoints (no auth required)
    demo: {
      generateSummary: (options: {
        materialId: string;
        summaryType: 'brief' | 'detailed' | 'key-points' | 'flashcards';
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        focusAreas?: string[];
      }) => api.post('/ai/demo/summary/generate', options),
      getJobStatus: (jobId: string) => api.get(`/ai/demo/job/${jobId}`),
    }
  },
};

export default api;
