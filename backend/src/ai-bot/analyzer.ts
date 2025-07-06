/**
 * AI Universal Learning Analyzer Bot (Full-Featured)
 *
 * This module handles multiple input formats and converts them into comprehensive learning materials
 * using OpenAI's language models and various parsing libraries.
 */

import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import { getSubtitles } from 'youtube-captions-scraper';
import { callOpenAI } from './openai';
import { 
  InputSource, 
  AnalysisRequest, 
  LearningOutput, 
  Flashcard, 
  Quiz, 
  Schedule 
} from './types';

export class UniversalLearningAnalyzer {
  /**
   * Main analysis function that routes to appropriate handler based on input type
   */
  async analyze(request: AnalysisRequest): Promise<LearningOutput> {
    const { source, options = {} } = request;
    
    try {
      let extractedText = '';
      
      // Extract text based on input type
      switch (source.type) {
        case 'text':
          extractedText = source.content || '';
          break;
        case 'pdf':
          extractedText = await this.extractFromPDF(source.buffer!);
          break;
        case 'docx':
          extractedText = await this.extractFromDocx(source.buffer!);
          break;
        case 'image':
          extractedText = await this.extractFromImage(source.filePath!);
          break;
        case 'youtube':
          extractedText = await this.extractFromYouTube(source.url!);
          break;
        default:
          throw new Error(`Unsupported input type: ${source.type}`);
      }

      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Insufficient text content extracted from input');
      }

      // Process with AI to generate learning materials
      return await this.processWithAI(extractedText, options);
      
    } catch (error: any) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF buffer
   */
  private async extractFromPDF(pdfBuffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error: any) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX buffer
   */
  private async extractFromDocx(docxBuffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: docxBuffer });
      return result.value;
    } catch (error: any) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract text from image using OCR
   */
  private async extractFromImage(imagePath: string): Promise<string> {
    try {
      const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
        logger: m => console.log(m) // Optional logging
      });
      return text;
    } catch (error: any) {
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Extract captions/transcript from YouTube video
   */
  private async extractFromYouTube(url: string): Promise<string> {
    try {
      // Extract video ID from URL
      const videoId = this.extractYouTubeVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Get captions
      const captions = await getSubtitles({
        videoID: videoId,
        lang: 'en' // Default to English
      });

      // Combine caption texts
      return captions.map(caption => caption.text).join(' ');
    } catch (error: any) {
      throw new Error(`YouTube transcript extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  /**
   * Process extracted text with AI to generate comprehensive learning materials
   */
  private async processWithAI(text: string, options: any = {}): Promise<LearningOutput> {
    const {
      flashcardCount = 10,
      quizCount = 5,
      summaryLength = 'medium',
      difficulty = 'intermediate',
      includeSchedule = true,
      scheduleStartDate,
      scheduleEndDate,
      totalStudyHours = 10
    } = options;

    try {
      // Create comprehensive prompt for AI
      const prompt = `
        Please analyze the following educational content and create comprehensive learning materials.
        
        Content to analyze:
        ${text.substring(0, 8000)} ${text.length > 8000 ? '...(content truncated)' : ''}
        
        Generate a JSON response with the following structure:
        {
          "summary": "A ${summaryLength} summary of the content (aim for ${this.getSummaryWordCount(summaryLength)} words)",
          "bulletPoints": ["Key point 1", "Key point 2", "Key point 3", ...],
          "flashcards": [
            {"question": "Question here?", "answer": "Answer here"},
            ...
          ],
          "quiz": [
            {
              "question": "Multiple choice question?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "a"
            },
            ...
          ],
          "recommendedSchedule": [
            {
              "date": "2025-07-07",
              "topic": "Topic name",
              "durationHours": 2
            },
            ...
          ]
        }
        
        Requirements:
        - Generate exactly ${flashcardCount} flashcards
        - Generate exactly ${quizCount} quiz questions
        - Create 5-10 bullet points with key takeaways
        - Difficulty level: ${difficulty}
        - Include practical, actionable study recommendations
        - Ensure quiz questions have only one correct answer (a, b, c, or d)
        - Make flashcards test understanding, not just memorization
        
        ${includeSchedule ? `
        For the schedule:
        - Distribute ${totalStudyHours} hours across ${this.getScheduleDays(scheduleStartDate, scheduleEndDate)} days
        - Start date: ${scheduleStartDate || '2025-07-07'}
        - End date: ${scheduleEndDate || '2025-07-21'}
        - Balance daily workload
        - Include review sessions
        ` : 'Skip the recommendedSchedule array.'}
      `;

      const systemMessage = `You are an expert educational content analyzer and learning specialist. 
      Create comprehensive, high-quality learning materials that help students understand and retain information effectively. 
      Focus on clarity, accuracy, and pedagogical value. Always return valid JSON.`;

      const response = await callOpenAI(prompt, systemMessage, {
        maxTokens: 4000,
        temperature: 0.3
      });

      // Parse AI response
      try {
        const learningOutput = JSON.parse(response);
        
        // Validate the response structure
        this.validateLearningOutput(learningOutput);
        
        return learningOutput as LearningOutput;
      } catch (parseError) {
        throw new Error('Failed to parse AI response as valid JSON');
      }

    } catch (error: any) {
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  /**
   * Get target word count for summary based on length
   */
  private getSummaryWordCount(length: string): number {
    switch (length) {
      case 'short': return 100;
      case 'medium': return 200;
      case 'long': return 400;
      default: return 200;
    }
  }

  /**
   * Calculate number of days between start and end date
   */
  private getScheduleDays(startDate?: string, endDate?: string): number {
    if (!startDate || !endDate) return 14; // Default 2 weeks
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(diffDays, 1);
  }

  /**
   * Validate the AI-generated learning output
   */
  private validateLearningOutput(output: any): void {
    const required = ['summary', 'bulletPoints', 'flashcards', 'quiz'];
    
    for (const field of required) {
      if (!output[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Array.isArray(output.bulletPoints)) {
      throw new Error('bulletPoints must be an array');
    }

    if (!Array.isArray(output.flashcards)) {
      throw new Error('flashcards must be an array');
    }

    if (!Array.isArray(output.quiz)) {
      throw new Error('quiz must be an array');
    }

    // Validate flashcards structure
    for (const card of output.flashcards) {
      if (!card.question || !card.answer) {
        throw new Error('Each flashcard must have question and answer');
      }
    }

    // Validate quiz structure
    for (const question of output.quiz) {
      if (!question.question || !question.options || !question.answer) {
        throw new Error('Each quiz question must have question, options, and answer');
      }
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error('Each quiz question must have exactly 4 options');
      }
      if (!['a', 'b', 'c', 'd'].includes(question.answer)) {
        throw new Error('Quiz answer must be a, b, c, or d');
      }
    }
  }

  /**
   * Convenience methods for specific input types
   */
  async analyzeText(text: string, options?: any): Promise<LearningOutput> {
    return this.analyze({
      source: { type: 'text', content: text },
      options
    });
  }

  async analyzePDF(pdfBuffer: Buffer, options?: any): Promise<LearningOutput> {
    return this.analyze({
      source: { type: 'pdf', buffer: pdfBuffer },
      options
    });
  }

  async analyzeDocx(docxBuffer: Buffer, options?: any): Promise<LearningOutput> {
    return this.analyze({
      source: { type: 'docx', buffer: docxBuffer },
      options
    });
  }

  async analyzeImage(imagePath: string, options?: any): Promise<LearningOutput> {
    return this.analyze({
      source: { type: 'image', filePath: imagePath },
      options
    });
  }

  async analyzeYouTube(url: string, options?: any): Promise<LearningOutput> {
    return this.analyze({
      source: { type: 'youtube', url },
      options
    });
  }
}

// Export singleton instance
export const universalAnalyzer = new UniversalLearningAnalyzer();
