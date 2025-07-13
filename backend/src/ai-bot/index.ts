/**
 * AI Study Assistant Bot – Unified Learning and Productivity Engine
 *
 * This AI module provides students with powerful tools to:
 * 1. Summarize lengthy academic content into concise notes
 * 2. Generate structured bullet points and smart notes from text
 * 3. Create flashcards for memory retention (Q&A format)
 * 4. Generate quizzes (MCQs) with correct answers from any topic
 * 5. Automatically schedule study tasks based on user goals and time availability
 * 6. Recommend a personalized study plan with topic-wise breakdown
 *
 * 🔧 Technologies:
 * - Uses OpenAI GPT-3.5-turbo or GPT-4
 * - Input: User-provided text or topic (from frontend)
 * - Output: JSON structured objects for UI display
 * - Use `.env` for `OPENAI_API_KEY`
 */

// AI Bot Module - Main exports
export * from './types';
export * from './openai';
export { SummarizerBot, summarizerBot } from './summarizer';
export { SchedulerBot, schedulerBot } from './scheduler';
export { UniversalLearningAnalyzer, universalAnalyzer } from './analyzer';

// Re-export commonly used interfaces
export type {
  MaterialContent,
  SummaryRequest,
  SummaryResponse,
  ScheduleRequest,
  ScheduleResponse,
  ScheduledSession,
  AIBotError,
  AIProcessingStatus,
  Flashcard,
  Quiz,
  Schedule,
  LearningOutput,
  InputSource,
  AnalysisRequest,
  AnalysisResponse,
} from './types';

// Main AI Bot orchestrator class
import { summarizerBot } from './summarizer';
import { schedulerBot } from './scheduler';
import { universalAnalyzer } from './analyzer';
import { validateOpenAIConfig, testOpenAIConnection, callOpenAI } from './openai';
import { 
  MaterialContent, 
  SummaryRequest, 
  ScheduleRequest, 
  AIProcessingStatus,
  Flashcard,
  Quiz,
  Schedule,
  LearningOutput,
  AnalysisRequest
} from './types';

export class AIBotManager {
  private processingJobs: Map<string, AIProcessingStatus> = new Map();

  constructor() {
    // Validate configuration on initialization
    if (!validateOpenAIConfig()) {
      console.warn('OpenAI configuration is invalid. AI features may not work.');
    }
  }

  /**
   * Test AI service connectivity
   */
  async testConnection(): Promise<boolean> {
    return testOpenAIConnection();
  }

  /**
   * ✅ Summarization:
   * generateSummary(content: string): Promise<string>
   * → Reduces a full chapter or paragraph into a brief summary (150-200 words).
   */
  async generateSummary(content: string): Promise<string> {
    try {
      const prompt = `
        Please provide a concise summary of the following content in 150-200 words.
        Focus on the key concepts, main ideas, and important details.
        Make it clear and easy to understand for students.

        Content:
        ${content}

        Summary:
      `;

      const summary = await callOpenAI(prompt, 'You are an expert academic summarizer. Create clear, concise summaries that help students understand and retain key information.');
      return summary;
    } catch (error: any) {
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * ✅ Smart Note Generator:
   * generateSmartNotes(content: string): Promise<string[]>
   * → Extracts key takeaways in bullet point format.
   */
  async generateSmartNotes(content: string): Promise<string[]> {
    try {
      const prompt = `
        Extract the most important points from the following content and present them as clear, concise bullet points.
        Each bullet point should be a complete thought that captures a key concept or important detail.
        Aim for 5-10 bullet points maximum.

        Content:
        ${content}

        Return the response as a JSON array of strings, like this:
        ["Point 1", "Point 2", "Point 3"]
      `;

      const response = await callOpenAI(prompt, 'You are an expert at extracting key information and creating study notes. Focus on the most important concepts that students need to remember.');
      
      try {
        const notes = JSON.parse(response);
        return Array.isArray(notes) ? notes : [response];
      } catch {
        // If JSON parsing fails, split by lines and clean up
        return response.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^[-•]\s*/, '').trim());
      }
    } catch (error: any) {
      throw new Error(`Failed to generate smart notes: ${error.message}`);
    }
  }

  /**
   * ✅ Flashcard Generator:
   * generateFlashcards(topic: string, count?: number): Promise<Flashcard[]>
   * → Returns Q&A pairs for memory reinforcement.
   */
  async generateFlashcards(topic: string, count: number = 5): Promise<Flashcard[]> {
    try {
      const prompt = `
        Create ${count} flashcards for the topic: "${topic}"
        
        Each flashcard should have:
        - A clear, specific question on the front
        - A concise, accurate answer on the back
        
        Focus on key concepts, definitions, important facts, and understanding.
        Make questions that test comprehension, not just memorization.

        Return the response as a JSON array in this exact format:
        [
          {"question": "Question 1?", "answer": "Answer 1"},
          {"question": "Question 2?", "answer": "Answer 2"}
        ]
      `;

      const response = await callOpenAI(prompt, 'You are an expert educator creating flashcards for effective learning. Make questions that promote understanding and retention.');
      
      try {
        const flashcards = JSON.parse(response);
        return Array.isArray(flashcards) ? flashcards : [];
      } catch {
        throw new Error('Failed to parse flashcards response');
      }
    } catch (error: any) {
      throw new Error(`Failed to generate flashcards: ${error.message}`);
    }
  }

  /**
   * ✅ Quiz Generator:
   * generateQuiz(topic: string, count?: number): Promise<Quiz[]>
   * → MCQ-based quiz with 4 options and one correct answer.
   */
  async generateQuiz(topic: string, count: number = 5): Promise<Quiz[]> {
    try {
      const prompt = `
        Create ${count} multiple choice questions about: "${topic}"
        
        Each question should have:
        - A clear, well-formed question
        - 4 answer options (a, b, c, d)
        - One correct answer (indicate with 'a', 'b', 'c', or 'd')
        
        Make questions that test understanding, application, and critical thinking.
        Ensure distractors (wrong answers) are plausible but clearly incorrect.

        Return the response as a JSON array in this exact format:
        [
          {
            "question": "What is...?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "a"
          }
        ]
      `;

      const response = await callOpenAI(prompt, 'You are an expert quiz creator. Make challenging but fair questions that test student understanding.');
      
      try {
        const quiz = JSON.parse(response);
        return Array.isArray(quiz) ? quiz : [];
      } catch {
        throw new Error('Failed to parse quiz response');
      }
    } catch (error: any) {
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  /**
   * ✅ Smart Scheduler:
   * generateSchedule(topics: string[], totalHours: number, startDate: string, endDate: string): Promise<Schedule[]>
   * → Plans study time over days, balancing load intelligently.
   */
  async generateSchedule(topics: string[], totalHours: number, startDate: string, endDate: string): Promise<Schedule[]> {
    try {
      const prompt = `
        Create a study schedule with the following parameters:
        - Topics to study: ${topics.join(', ')}
        - Total available hours: ${totalHours}
        - Start date: ${startDate}
        - End date: ${endDate}
        
        Rules:
        - Distribute study time evenly across topics
        - Balance daily workload (don't overload any single day)
        - Consider weekends vs weekdays
        - Include review sessions for better retention
        - Each study session should be 1-3 hours maximum
        
        Return the response as a JSON array in this exact format:
        [
          {
            "date": "2025-01-15",
            "topic": "Mathematics",
            "durationHours": 2
          }
        ]
      `;

      const response = await callOpenAI(prompt, 'You are an expert study planner. Create realistic, balanced schedules that optimize learning outcomes.');
      
      try {
        const schedule = JSON.parse(response);
        return Array.isArray(schedule) ? schedule : [];
      } catch {
        throw new Error('Failed to parse schedule response');
      }
    } catch (error: any) {
      throw new Error(`Failed to generate schedule: ${error.message}`);
    }
  }

  /**
   * ✅ Study Plan Recommender:
   * recommendStudyPlan(goal: string, availableHours: number): Promise<string[]>
   * → Suggests what to study, when, and how based on user goals.
   */
  async recommendStudyPlan(goal: string, availableHours: number): Promise<string[]> {
    try {
      const prompt = `
        Create a comprehensive study plan recommendation for this goal: "${goal}"
        Available study time per week: ${availableHours} hours
        
        Provide specific recommendations including:
        - What topics/subjects to focus on
        - How to allocate time effectively
        - Study methods and techniques
        - Milestones and checkpoints
        - Tips for staying motivated
        - Resource recommendations
        
        Make it actionable and realistic for the available time.
        
        Return the response as a JSON array of recommendation strings:
        ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
      `;

      const response = await callOpenAI(prompt, 'You are an expert academic advisor. Provide practical, actionable study plans that help students achieve their goals efficiently.');
      
      try {
        const recommendations = JSON.parse(response);
        return Array.isArray(recommendations) ? recommendations : [response];
      } catch {
        // If JSON parsing fails, split by lines and clean up
        return response.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^[-•]\s*/, '').trim());
      }
    } catch (error: any) {
      throw new Error(`Failed to generate study plan: ${error.message}`);
    }
  }

  /**
   * Generate a summary (async with job tracking) - Legacy support
   */
  async createSummary(request: SummaryRequest): Promise<string> {
    const jobId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create processing status
    const status: AIProcessingStatus = {
      id: jobId,
      type: 'summarization',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };
    
    this.processingJobs.set(jobId, status);
    
    try {
      // Update status to processing
      status.status = 'processing';
      status.progress = 25;
      this.processingJobs.set(jobId, status);
      
      // Generate summary using legacy method
      const result = await summarizerBot.generateSummary(request);
      
      // Update status to completed
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      status.result = result;
      this.processingJobs.set(jobId, status);
      
      return jobId;
    } catch (error: any) {
      // Update status to failed
      status.status = 'failed';
      status.error = {
        code: 'AI_SERVICE_ERROR',
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
      status.completedAt = new Date();
      this.processingJobs.set(jobId, status);
      
      throw error;
    }
  }

  /**
   * Generate flashcards with job tracking
   */
  async createFlashcards(topic: string, count: number = 5): Promise<string> {
    const jobId = `flashcards_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const status: AIProcessingStatus = {
      id: jobId,
      type: 'flashcards',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };
    
    this.processingJobs.set(jobId, status);
    
    try {
      status.status = 'processing';
      status.progress = 50;
      this.processingJobs.set(jobId, status);
      
      const result = await this.generateFlashcards(topic, count);
      
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      status.result = result;
      this.processingJobs.set(jobId, status);
      
      return jobId;
    } catch (error: any) {
      status.status = 'failed';
      status.error = {
        code: 'AI_SERVICE_ERROR',
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
      status.completedAt = new Date();
      this.processingJobs.set(jobId, status);
      
      throw error;
    }
  }

  /**
   * Generate quiz with job tracking
   */
  async createQuiz(topic: string, count: number = 5): Promise<string> {
    const jobId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const status: AIProcessingStatus = {
      id: jobId,
      type: 'quiz',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };
    
    this.processingJobs.set(jobId, status);
    
    try {
      status.status = 'processing';
      status.progress = 50;
      this.processingJobs.set(jobId, status);
      
      const result = await this.generateQuiz(topic, count);
      
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      status.result = result;
      this.processingJobs.set(jobId, status);
      
      return jobId;
    } catch (error: any) {
      status.status = 'failed';
      status.error = {
        code: 'AI_SERVICE_ERROR',
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
      status.completedAt = new Date();
      this.processingJobs.set(jobId, status);
      
      throw error;
    }
  }

  /**
   * Generate smart notes with job tracking
   */
  async createSmartNotes(content: string): Promise<string> {
    const jobId = `notes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const status: AIProcessingStatus = {
      id: jobId,
      type: 'smart-notes',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };
    
    this.processingJobs.set(jobId, status);
    
    try {
      status.status = 'processing';
      status.progress = 50;
      this.processingJobs.set(jobId, status);
      
      const result = await this.generateSmartNotes(content);
      
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      status.result = result;
      this.processingJobs.set(jobId, status);
      
      return jobId;
    } catch (error: any) {
      status.status = 'failed';
      status.error = {
        code: 'AI_SERVICE_ERROR',
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
      status.completedAt = new Date();
      this.processingJobs.set(jobId, status);
      
      throw error;
    }
  }

  /**
   * Generate study plan with job tracking
   */
  async createStudyPlan(goal: string, availableHours: number): Promise<string> {
    const jobId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const status: AIProcessingStatus = {
      id: jobId,
      type: 'study-plan',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };
    
    this.processingJobs.set(jobId, status);
    
    try {
      status.status = 'processing';
      status.progress = 50;
      this.processingJobs.set(jobId, status);
      
      const result = await this.recommendStudyPlan(goal, availableHours);
      
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      status.result = result;
      this.processingJobs.set(jobId, status);
      
      return jobId;
    } catch (error: any) {
      status.status = 'failed';
      status.error = {
        code: 'AI_SERVICE_ERROR',
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
      status.completedAt = new Date();
      this.processingJobs.set(jobId, status);
      
      throw error;
    }
  }

  /**
   * Generate a summary with streaming
   */
  async createSummaryStream(
    request: SummaryRequest,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const jobId = `summary_stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const status: AIProcessingStatus = {
      id: jobId,
      type: 'summarization',
      status: 'processing',
      progress: 0,
      startedAt: new Date(),
    };
    
    this.processingJobs.set(jobId, status);
    
    try {
      const result = await summarizerBot.generateSummaryStream(request, (chunk) => {
        status.progress = Math.min(status.progress + 5, 90);
        this.processingJobs.set(jobId, status);
        onChunk?.(chunk);
      });
      
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      status.result = result;
      this.processingJobs.set(jobId, status);
      
      return jobId;
    } catch (error: any) {
      status.status = 'failed';
      status.error = {
        code: 'AI_SERVICE_ERROR',
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
      status.completedAt = new Date();
      this.processingJobs.set(jobId, status);
      
      throw error;
    }
  }

  /**
   * Create schedule with new simplified interface
   */
  async createSimpleSchedule(topics: string[], totalHours: number, startDate: string, endDate: string): Promise<string> {
    const jobId = `simple_schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const status: AIProcessingStatus = {
      id: jobId,
      type: 'scheduling',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };
    
    this.processingJobs.set(jobId, status);
    
    try {
      status.status = 'processing';
      status.progress = 50;
      this.processingJobs.set(jobId, status);
      
      const result = await this.generateSchedule(topics, totalHours, startDate, endDate);
      
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      status.result = result;
      this.processingJobs.set(jobId, status);
      
      return jobId;
    } catch (error: any) {
      status.status = 'failed';
      status.error = {
        code: 'AI_SERVICE_ERROR',
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
      status.completedAt = new Date();
      this.processingJobs.set(jobId, status);
      
      throw error;
    }
  }

  /**
   * Generate a schedule (async with job tracking) - Legacy support
   */
  async createSchedule(request: ScheduleRequest): Promise<string> {
    const jobId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const status: AIProcessingStatus = {
      id: jobId,
      type: 'scheduling',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };
    
    this.processingJobs.set(jobId, status);
    
    try {
      status.status = 'processing';
      status.progress = 25;
      this.processingJobs.set(jobId, status);
      
      const result = await schedulerBot.generateSchedule(request);
      
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      status.result = result;
      this.processingJobs.set(jobId, status);
      
      return jobId;
    } catch (error: any) {
      status.status = 'failed';
      status.error = {
        code: 'AI_SERVICE_ERROR',
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
      status.completedAt = new Date();
      this.processingJobs.set(jobId, status);
      
      throw error;
    }
  }

  /**
   * Get processing job status
   */
  getJobStatus(jobId: string): AIProcessingStatus | null {
    return this.processingJobs.get(jobId) || null;
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): AIProcessingStatus[] {
    return Array.from(this.processingJobs.values())
      .filter(job => job.status === 'pending' || job.status === 'processing');
  }

  /**
   * Clean up completed jobs (older than 1 hour)
   */
  cleanupJobs(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    for (const [jobId, status] of this.processingJobs.entries()) {
      if (status.completedAt && status.completedAt < oneHourAgo) {
        this.processingJobs.delete(jobId);
      }
    }
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(summaries: any[]): Promise<any> {
    return summarizerBot.getSummaryStats(summaries);
  }

  /**
   * Get schedule analytics
   */
  getScheduleAnalytics(sessions: any[]): any {
    return schedulerBot.getScheduleAnalytics(sessions);
  }

  /**
   * 🚀 Universal Learning Analyzer Methods
   * These methods handle multiple input formats and generate comprehensive learning materials
   */

  /**
   * Analyze text content and generate comprehensive learning materials
   */
  async analyzeText(text: string, options?: any): Promise<LearningOutput> {
    try {
      return await universalAnalyzer.analyzeText(text, options);
    } catch (error: any) {
      throw new Error(`Text analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze PDF buffer and generate comprehensive learning materials
   */
  async analyzePDF(pdfBuffer: Buffer, options?: any): Promise<LearningOutput> {
    try {
      return await universalAnalyzer.analyzePDF(pdfBuffer, options);
    } catch (error: any) {
      throw new Error(`PDF analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze DOCX buffer and generate comprehensive learning materials
   */
  async analyzeDocx(docxBuffer: Buffer, options?: any): Promise<LearningOutput> {
    try {
      return await universalAnalyzer.analyzeDocx(docxBuffer, options);
    } catch (error: any) {
      throw new Error(`DOCX analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze image using OCR and generate comprehensive learning materials
   */
  async analyzeImage(imagePath: string, options?: any): Promise<LearningOutput> {
    try {
      return await universalAnalyzer.analyzeImage(imagePath, options);
    } catch (error: any) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze YouTube video transcript and generate comprehensive learning materials
   */
  async analyzeYouTube(url: string, options?: any): Promise<LearningOutput> {
    try {
      return await universalAnalyzer.analyzeYouTube(url, options);
    } catch (error: any) {
      throw new Error(`YouTube analysis failed: ${error.message}`);
    }
  }

  /**
   * Universal analyzer with job tracking
   */
  async createUniversalAnalysis(request: AnalysisRequest): Promise<string> {
    const jobId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const status: AIProcessingStatus = {
      id: jobId,
      type: 'universal-analysis',
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
    };
    
    this.processingJobs.set(jobId, status);
    
    try {
      status.status = 'processing';
      status.progress = 25;
      this.processingJobs.set(jobId, status);
      
      // Process based on input type
      let result: LearningOutput;
      
      switch (request.source.type) {
        case 'text':
          status.progress = 40;
          this.processingJobs.set(jobId, status);
          result = await this.analyzeText(request.source.content!, request.options);
          break;
        case 'pdf':
          status.progress = 40;
          this.processingJobs.set(jobId, status);
          result = await this.analyzePDF(request.source.buffer!, request.options);
          break;
        case 'docx':
          status.progress = 40;
          this.processingJobs.set(jobId, status);
          result = await this.analyzeDocx(request.source.buffer!, request.options);
          break;
        case 'image':
          status.progress = 40;
          this.processingJobs.set(jobId, status);
          result = await this.analyzeImage(request.source.filePath!, request.options);
          break;
        case 'youtube':
          status.progress = 40;
          this.processingJobs.set(jobId, status);
          result = await this.analyzeYouTube(request.source.url!, request.options);
          break;
        default:
          throw new Error(`Unsupported input type: ${request.source.type}`);
      }
      
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      status.result = result;
      this.processingJobs.set(jobId, status);
      
      return jobId;
    } catch (error: any) {
      status.status = 'failed';
      status.error = {
        code: 'AI_SERVICE_ERROR',
        message: error.message,
        details: error,
        timestamp: new Date(),
      };
      status.completedAt = new Date();
      this.processingJobs.set(jobId, status);
      
      throw error;
    }
  }
}

// Export singleton instance
export const aiBotManager = new AIBotManager();

// Auto-cleanup jobs every hour
setInterval(() => {
  aiBotManager.cleanupJobs();
}, 60 * 60 * 1000);
