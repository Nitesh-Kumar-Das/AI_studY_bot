import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, StudyMaterial, StudySchedule, StudySummary, LoadingState } from '../types';

interface UserStore {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Study materials state
  materials: StudyMaterial[];
  
  // Schedule state
  schedules: StudySchedule[];
  
  // Summary state
  summaries: StudySummary[];
  
  // Loading states
  loading: {
    auth: LoadingState;
    materials: LoadingState;
    schedule: LoadingState;
    summary: LoadingState;
  };
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  
  // Material actions
  setMaterials: (materials: StudyMaterial[]) => void;
  addMaterial: (material: StudyMaterial) => void;
  removeMaterial: (materialId: string) => void;
  
  // Schedule actions
  setSchedules: (schedules: StudySchedule[]) => void;
  addSchedule: (schedule: StudySchedule) => void;
  updateSchedule: (scheduleId: string, updates: Partial<StudySchedule>) => void;
  removeSchedule: (scheduleId: string) => void;
  
  // Summary actions
  setSummaries: (summaries: StudySummary[]) => void;
  addSummary: (summary: StudySummary) => void;
  removeSummary: (summaryId: string) => void;
  
  // Loading state actions
  setLoading: (key: keyof UserStore['loading'], state: Partial<LoadingState>) => void;
  
  // Data loading actions
  loadUserData: () => Promise<void>;
  
  // Reset store
  reset: () => void;
}

const initialLoadingState: LoadingState = {
  isLoading: false,
  error: null,
};

const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      materials: [
        {
          id: 'sample-material-1',
          title: 'Introduction to Machine Learning',
          content: 'Machine Learning is a subset of artificial intelligence that focuses on algorithms that can learn and make predictions from data. ML algorithms build mathematical models based on training data to make predictions or decisions without being explicitly programmed to do so. The field encompasses supervised learning, unsupervised learning, and reinforcement learning approaches. Common applications include image recognition, natural language processing, recommendation systems, and predictive analytics.',
          type: 'text' as const,
          uploadedAt: new Date('2025-01-01'),
          userId: 'sample-user'
        },
        {
          id: 'sample-material-2', 
          title: 'Neural Networks Fundamentals',
          content: 'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes called neurons organized in layers. Each connection has an associated weight that adjusts as learning proceeds. Neural networks can learn complex patterns and relationships in data through backpropagation and gradient descent optimization. They form the foundation of deep learning and are used in applications like computer vision, speech recognition, and game playing.',
          type: 'pdf' as const,
          uploadedAt: new Date('2025-01-02'),
          userId: 'sample-user'
        },
        {
          id: 'sample-material-3',
          title: 'Deep Learning Applications',
          content: 'Deep learning has revolutionized many fields including computer vision, natural language processing, and robotics. Convolutional Neural Networks (CNNs) excel at image recognition tasks. Recurrent Neural Networks (RNNs) and Transformers are powerful for sequence modeling and language tasks. Applications include autonomous vehicles, medical diagnosis, language translation, content generation, and scientific research. The field continues to advance with new architectures and training techniques.',
          type: 'video' as const,
          uploadedAt: new Date('2025-01-03'),
          userId: 'sample-user'
        }
      ],
      schedules: [],
      summaries: [],
      loading: {
        auth: initialLoadingState,
        materials: initialLoadingState,
        schedule: initialLoadingState,
        summary: initialLoadingState,
      },
      
      // User actions
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      // Material actions
      setMaterials: (materials) => set({ materials }),
      addMaterial: (material) => set((state) => ({
        materials: [...state.materials, material],
      })),
      removeMaterial: (materialId) => set((state) => ({
        materials: state.materials.filter((m) => m.id !== materialId),
      })),
      
      // Schedule actions
      setSchedules: (schedules) => set({ schedules }),
      addSchedule: (schedule) => set((state) => ({
        schedules: [...state.schedules, schedule],
      })),
      updateSchedule: (scheduleId, updates) => set((state) => ({
        schedules: state.schedules.map((s) =>
          s.id === scheduleId ? { ...s, ...updates } : s
        ),
      })),
      removeSchedule: (scheduleId) => set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== scheduleId),
      })),
      
      // Summary actions
      setSummaries: (summaries) => set({ summaries }),
      addSummary: (summary) => set((state) => ({
        summaries: [...state.summaries, summary],
      })),
      removeSummary: (summaryId) => set((state) => ({
        summaries: state.summaries.filter((s) => s.id !== summaryId),
      })),
      
      // Loading state actions
      setLoading: (key, state) => set((prev) => ({
        loading: {
          ...prev.loading,
          [key]: { ...prev.loading[key], ...state },
        },
      })),
      
      // Data loading actions
      loadUserData: async () => {
        const { apiHelper } = await import('../lib/api');
        
        try {
          set((state) => ({
            loading: {
              ...state.loading,
              materials: { isLoading: true, error: null },
              summary: { isLoading: true, error: null },
            },
          }));

          // Load materials and summaries from backend
          const [materialsResponse, summariesResponse] = await Promise.all([
            apiHelper.materials.getAll(),
            apiHelper.summary.getAll(),
          ]);

          set((state) => ({
            materials: materialsResponse.data?.materials || [],
            summaries: summariesResponse.data?.summaries || [],
            loading: {
              ...state.loading,
              materials: { isLoading: false, error: null },
              summary: { isLoading: false, error: null },
            },
          }));
        } catch (error: any) {
          set((state) => ({
            loading: {
              ...state.loading,
              materials: { isLoading: false, error: error.message },
              summary: { isLoading: false, error: error.message },
            },
          }));
        }
      },
      
      // Reset store
      reset: () => set({
        user: null,
        isAuthenticated: false,
        materials: [
          {
            id: 'sample-material-1',
            title: 'Introduction to Machine Learning',
            content: 'Machine Learning is a subset of artificial intelligence that focuses on algorithms that can learn and make predictions from data. ML algorithms build mathematical models based on training data to make predictions or decisions without being explicitly programmed to do so. The field encompasses supervised learning, unsupervised learning, and reinforcement learning approaches. Common applications include image recognition, natural language processing, recommendation systems, and predictive analytics.',
            type: 'text' as const,
            uploadedAt: new Date('2025-01-01'),
            userId: 'sample-user'
          },
          {
            id: 'sample-material-2', 
            title: 'Neural Networks Fundamentals',
            content: 'Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes called neurons organized in layers. Each connection has an associated weight that adjusts as learning proceeds. Neural networks can learn complex patterns and relationships in data through backpropagation and gradient descent optimization. They form the foundation of deep learning and are used in applications like computer vision, speech recognition, and game playing.',
            type: 'pdf' as const,
            uploadedAt: new Date('2025-01-02'),
            userId: 'sample-user'
          },
          {
            id: 'sample-material-3',
            title: 'Deep Learning Applications',
            content: 'Deep learning has revolutionized many fields including computer vision, natural language processing, and robotics. Convolutional Neural Networks (CNNs) excel at image recognition tasks. Recurrent Neural Networks (RNNs) and Transformers are powerful for sequence modeling and language tasks. Applications include autonomous vehicles, medical diagnosis, language translation, content generation, and scientific research. The field continues to advance with new architectures and training techniques.',
            type: 'video' as const,
            uploadedAt: new Date('2025-01-03'),
            userId: 'sample-user'
          }
        ],
        schedules: [],
        summaries: [],
        loading: {
          auth: initialLoadingState,
          materials: initialLoadingState,
          schedule: initialLoadingState,
          summary: initialLoadingState,
        },
      }),
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        materials: state.materials.filter(m => !m.id.startsWith('sample-material-')), // Don't persist sample data
        summaries: state.summaries,
      }),
    }
  )
);

export default useUserStore;
