import { readFileSync } from 'fs';
import { join } from 'path';
import { callOpenAI, AI_CONFIG } from './openai';
import { 
  MaterialContent, 
  ScheduleRequest, 
  ScheduleResponse, 
  ScheduledSession,
  DEFAULT_VALIDATION 
} from './types';

// Load prompt template
const SCHEDULER_PROMPT = readFileSync(
  join(__dirname, 'prompts', 'scheduler.txt'), 
  'utf-8'
);

export class SchedulerBot {
  private validateInput(request: ScheduleRequest): void {
    const { materials, userPreferences, goals } = request;
    
    // Validate materials
    if (!materials || materials.length === 0) {
      throw new Error('At least one material is required for scheduling');
    }
    
    if (materials.length > DEFAULT_VALIDATION.schedule.maxMaterials) {
      throw new Error(`Maximum ${DEFAULT_VALIDATION.schedule.maxMaterials} materials can be scheduled at once`);
    }
    
    // Validate session preferences
    if (userPreferences.maxSessionsPerDay > DEFAULT_VALIDATION.schedule.maxSessionsPerDay) {
      throw new Error(`Maximum ${DEFAULT_VALIDATION.schedule.maxSessionsPerDay} sessions per day allowed`);
    }
    
    if (userPreferences.preferredSessionLength > DEFAULT_VALIDATION.schedule.maxSessionDuration ||
        userPreferences.preferredSessionLength < DEFAULT_VALIDATION.schedule.minSessionDuration) {
      throw new Error(`Session length must be between ${DEFAULT_VALIDATION.schedule.minSessionDuration} and ${DEFAULT_VALIDATION.schedule.maxSessionDuration} minutes`);
    }
    
    // Validate available hours format
    Object.entries(userPreferences.availableHours).forEach(([day, slots]) => {
      if (!Array.isArray(slots)) {
        throw new Error(`Invalid time slots format for ${day}`);
      }
      slots.forEach(slot => {
        if (!slot.start || !slot.end) {
          throw new Error(`Invalid time slot format for ${day}: missing start or end time`);
        }
      });
    });
  }

  private buildPrompt(request: ScheduleRequest): string {
    const { materials, userPreferences, goals } = request;
    
    // Format materials data
    const materialsData = materials.map(material => ({
      id: material.id,
      title: material.title,
      type: material.type,
      contentLength: material.content.length,
      estimatedStudyTime: this.estimateStudyTime(material),
    }));
    
    // Format available hours
    const availableHoursStr = Object.entries(userPreferences.availableHours)
      .map(([day, slots]) => `${day}: ${slots.map(slot => `${slot.start}-${slot.end}`).join(', ')}`)
      .join('\n');
    
    return SCHEDULER_PROMPT
      .replace('{materialCount}', materials.length.toString())
      .replace('{availableHours}', availableHoursStr)
      .replace('{preferredSessionLength}', userPreferences.preferredSessionLength.toString())
      .replace('{maxSessionsPerDay}', userPreferences.maxSessionsPerDay.toString())
      .replace('{learningStyle}', userPreferences.learningStyle)
      .replace('{difficultyProgression}', userPreferences.difficultyProgression)
      .replace('{targetCompletionDate}', goals.targetCompletionDate?.toISOString() || 'flexible')
      .replace('{priority}', goals.priority)
      .replace('{reviewFrequency}', goals.reviewFrequency)
      .replace('{materialsData}', JSON.stringify(materialsData, null, 2))
      .replace('{currentDate}', new Date().toISOString())
      .replace('{userTimezone}', Intl.DateTimeFormat().resolvedOptions().timeZone);
  }

  private estimateStudyTime(material: MaterialContent): number {
    // Basic estimation based on content type and length
    const baseMinutes = {
      'pdf': 2, // 2 minutes per 1000 characters
      'video': 1.5, // Assume video length metadata if available
      'audio': 1.2,
      'text': 1.8,
    };
    
    const contentLength = material.content.length;
    const baseTime = (contentLength / 1000) * (baseMinutes[material.type] || 2);
    
    // Add complexity factors
    let complexityMultiplier = 1;
    
    // Check for technical terms, formulas, etc.
    const complexPatterns = [
      /\$.*?\$/g, // Math formulas
      /[A-Z]{3,}/g, // Acronyms
      /\b\d+\.\d+\b/g, // Numbers with decimals
      /\b[a-z]+\([^)]*\)/g, // Function calls
    ];
    
    complexPatterns.forEach(pattern => {
      const matches = material.content.match(pattern);
      if (matches && matches.length > 10) {
        complexityMultiplier += 0.2;
      }
    });
    
    return Math.ceil(baseTime * complexityMultiplier);
  }

  private parseAIResponse(response: string): Partial<ScheduleResponse> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return this.validateScheduleResponse(parsed);
      }
      
      // Fallback: create basic schedule structure
      return this.createFallbackSchedule(response);
    } catch (error) {
      console.error('Failed to parse AI schedule response:', error);
      return this.createFallbackSchedule(response);
    }
  }

  private validateScheduleResponse(parsed: any): Partial<ScheduleResponse> {
    // Validate and sanitize the parsed response
    const schedule: ScheduledSession[] = [];
    
    if (parsed.schedule && Array.isArray(parsed.schedule)) {
      parsed.schedule.forEach((session: any, index: number) => {
        try {
          schedule.push({
            id: session.id || `session_${Date.now()}_${index}`,
            materialId: session.materialId || '',
            title: session.title || 'Study Session',
            description: session.description || '',
            scheduledDate: new Date(session.scheduledDate),
            duration: Math.min(Math.max(session.duration || 60, 15), 180), // Clamp between 15-180 minutes
            sessionType: ['study', 'review', 'practice', 'assessment'].includes(session.sessionType) 
              ? session.sessionType : 'study',
            difficulty: ['beginner', 'intermediate', 'advanced'].includes(session.difficulty) 
              ? session.difficulty : 'intermediate',
            priority: ['high', 'medium', 'low'].includes(session.priority) 
              ? session.priority : 'medium',
            prerequisites: Array.isArray(session.prerequisites) ? session.prerequisites : [],
            estimatedEffort: ['light', 'moderate', 'intensive'].includes(session.estimatedEffort) 
              ? session.estimatedEffort : 'moderate',
            completed: false,
          });
        } catch (error) {
          console.error('Invalid session data:', session, error);
        }
      });
    }
    
    return {
      schedule,
      recommendations: parsed.recommendations || {},
      analytics: parsed.analytics || {},
    };
  }

  private createFallbackSchedule(response: string): Partial<ScheduleResponse> {
    // Create a basic schedule structure as fallback
    return {
      schedule: [],
      recommendations: {
        totalEstimatedTime: 0,
        suggestedStartDate: new Date(),
        completionDate: new Date(),
        weeklyTimeCommitment: 0,
        suggestions: ['AI scheduling temporarily unavailable. Please create schedule manually.'],
      },
      analytics: {
        materialDistribution: {},
        difficultyProgression: {},
        sessionTypeDistribution: {},
      },
    };
  }

  private calculateScheduleMetrics(schedule: ScheduledSession[], materials: MaterialContent[]): any {
    const totalTime = schedule.reduce((sum, session) => sum + session.duration, 0);
    const totalHours = totalTime / 60;
    
    const materialDistribution = schedule.reduce((acc, session) => {
      acc[session.materialId] = (acc[session.materialId] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);
    
    const sessionTypeDistribution = schedule.reduce((acc, session) => {
      acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const difficultyProgression: Record<number, string> = {};
    schedule.forEach((session, index) => {
      const weekNumber = Math.floor(index / 7) + 1;
      if (!difficultyProgression[weekNumber]) {
        difficultyProgression[weekNumber] = session.difficulty;
      }
    });
    
    return {
      totalEstimatedTime: totalHours,
      materialDistribution: Object.entries(materialDistribution).reduce((acc, [id, duration]) => {
        acc[id] = Math.round((duration / totalTime) * 100);
        return acc;
      }, {} as Record<string, number>),
      sessionTypeDistribution,
      difficultyProgression,
    };
  }

  /**
   * Generate an optimized study schedule
   */
  async generateSchedule(request: ScheduleRequest): Promise<ScheduleResponse> {
    const startTime = Date.now();
    
    try {
      // Validate input
      this.validateInput(request);
      
      // Build prompt
      const prompt = this.buildPrompt(request);
      
      // Call OpenAI
      const aiResponse = await callOpenAI(prompt, undefined, {
        temperature: 0.3, // Lower temperature for more consistent scheduling
        maxTokens: 3000,
      });
      
      // Parse response
      const parsedResponse = this.parseAIResponse(aiResponse);
      
      // Calculate additional metrics
      const metrics = this.calculateScheduleMetrics(
        parsedResponse.schedule || [], 
        request.materials
      );
      
      // Build final response
      const scheduleResponse: ScheduleResponse = {
        schedule: parsedResponse.schedule || [],
        recommendations: {
          totalEstimatedTime: metrics.totalEstimatedTime,
          suggestedStartDate: new Date(),
          completionDate: this.calculateCompletionDate(parsedResponse.schedule || []),
          weeklyTimeCommitment: this.calculateWeeklyCommitment(parsedResponse.schedule || []),
          suggestions: parsedResponse.recommendations?.suggestions || [
            'Follow the spaced repetition schedule for optimal retention',
            'Take breaks between intensive study sessions',
            'Review difficult concepts before proceeding to advanced topics',
          ],
        },
        analytics: {
          materialDistribution: metrics.materialDistribution,
          difficultyProgression: metrics.difficultyProgression,
          sessionTypeDistribution: metrics.sessionTypeDistribution,
        },
        metadata: {
          aiModel: AI_CONFIG.model,
          generatedAt: new Date(),
          processingTime: Date.now() - startTime,
          confidence: this.calculateConfidenceScore(parsedResponse.schedule || []),
        },
      };
      
      return scheduleResponse;
    } catch (error: any) {
      console.error('Scheduling error:', error);
      throw new Error(`Failed to generate schedule: ${error.message}`);
    }
  }

  private calculateCompletionDate(schedule: ScheduledSession[]): Date {
    if (schedule.length === 0) return new Date();
    
    const lastSession = schedule.reduce((latest, session) => {
      return session.scheduledDate > latest.scheduledDate ? session : latest;
    });
    
    return lastSession.scheduledDate;
  }

  private calculateWeeklyCommitment(schedule: ScheduledSession[]): number {
    if (schedule.length === 0) return 0;
    
    const firstDate = schedule[0].scheduledDate;
    const lastDate = this.calculateCompletionDate(schedule);
    const totalWeeks = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const totalHours = schedule.reduce((sum, session) => sum + session.duration, 0) / 60;
    
    return totalWeeks > 0 ? Math.round(totalHours / totalWeeks * 10) / 10 : 0;
  }

  private calculateConfidenceScore(schedule: ScheduledSession[]): number {
    // Simple confidence calculation based on schedule completeness
    if (schedule.length === 0) return 0;
    
    let score = 0.5; // Base score
    
    // Check for proper progression
    const hasProgression = schedule.some((session, index) => {
      if (index === 0) return true;
      return session.scheduledDate >= schedule[index - 1].scheduledDate;
    });
    
    if (hasProgression) score += 0.2;
    
    // Check for variety in session types
    const sessionTypes = new Set(schedule.map(s => s.sessionType));
    if (sessionTypes.size > 1) score += 0.2;
    
    // Check for reasonable durations
    const reasonableDurations = schedule.every(s => s.duration >= 15 && s.duration <= 180);
    if (reasonableDurations) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Update an existing schedule based on progress
   */
  async updateSchedule(
    originalRequest: ScheduleRequest,
    completedSessions: ScheduledSession[],
    userFeedback?: { sessionId: string; rating: number; notes?: string }[]
  ): Promise<ScheduleResponse> {
    // Filter out completed materials and adjust preferences based on feedback
    const incompleteMaterials = originalRequest.materials.filter(material => {
      return !completedSessions.some(session => 
        session.materialId === material.id && session.completed
      );
    });
    
    // Adjust preferences based on user feedback
    let adjustedPreferences = { ...originalRequest.userPreferences };
    
    if (userFeedback && userFeedback.length > 0) {
      const avgRating = userFeedback.reduce((sum, fb) => sum + fb.rating, 0) / userFeedback.length;
      
      // Adjust session length based on ratings
      if (avgRating < 3) {
        // Reduce session length if ratings are low
        adjustedPreferences.preferredSessionLength = Math.max(
          adjustedPreferences.preferredSessionLength * 0.8,
          15
        );
      } else if (avgRating > 4) {
        // Increase session length if ratings are high
        adjustedPreferences.preferredSessionLength = Math.min(
          adjustedPreferences.preferredSessionLength * 1.2,
          180
        );
      }
    }
    
    const updatedRequest: ScheduleRequest = {
      ...originalRequest,
      materials: incompleteMaterials,
      userPreferences: adjustedPreferences,
      existingSchedule: completedSessions,
    };
    
    return this.generateSchedule(updatedRequest);
  }

  /**
   * Get schedule analytics
   */
  getScheduleAnalytics(sessions: ScheduledSession[]): any {
    const completedSessions = sessions.filter(s => s.completed);
    const pendingSessions = sessions.filter(s => !s.completed);
    
    const totalPlannedTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const completedTime = completedSessions.reduce((sum, s) => sum + (s.actualDuration || s.duration), 0);
    const remainingTime = pendingSessions.reduce((sum, s) => sum + s.duration, 0);
    
    const avgRating = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.userRating || 0), 0) / completedSessions.length
      : 0;
    
    const progressByMaterial = sessions.reduce((acc, session) => {
      if (!acc[session.materialId]) {
        acc[session.materialId] = { completed: 0, total: 0 };
      }
      acc[session.materialId].total++;
      if (session.completed) {
        acc[session.materialId].completed++;
      }
      return acc;
    }, {} as Record<string, { completed: number; total: number }>);
    
    return {
      overview: {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        pendingSessions: pendingSessions.length,
        completionRate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
      },
      timeTracking: {
        totalPlannedTime: Math.round(totalPlannedTime / 60 * 10) / 10, // Hours
        completedTime: Math.round(completedTime / 60 * 10) / 10,
        remainingTime: Math.round(remainingTime / 60 * 10) / 10,
        efficiency: totalPlannedTime > 0 ? (completedTime / totalPlannedTime) * 100 : 0,
      },
      performance: {
        avgRating: Math.round(avgRating * 10) / 10,
        avgSessionLength: completedSessions.length > 0 
          ? Math.round(completedTime / completedSessions.length) 
          : 0,
      },
      progressByMaterial: Object.entries(progressByMaterial).map(([materialId, progress]) => ({
        materialId,
        ...progress,
        progressPercentage: (progress.completed / progress.total) * 100,
      })),
    };
  }
}

// Export singleton instance
export const schedulerBot = new SchedulerBot();
