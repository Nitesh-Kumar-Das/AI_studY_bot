import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI configuration
export const AI_CONFIG = {
  model: 'gpt-4o-mini', // Updated to current available model
  temperature: 0.7,
  maxTokens: 2000,
  fallbackModel: 'gpt-3.5-turbo',
};

// Helper function to make OpenAI API calls with error handling
export async function callOpenAI(
  prompt: string,
  systemMessage?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: options?.model || AI_CONFIG.model,
      messages: [
        ...(systemMessage ? [{ role: 'system' as const, content: systemMessage }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature: options?.temperature || AI_CONFIG.temperature,
      max_tokens: options?.maxTokens || AI_CONFIG.maxTokens,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return content.trim();
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Try fallback model if primary model fails
    if (options?.model !== AI_CONFIG.fallbackModel) {
      console.log('Retrying with fallback model...');
      return callOpenAI(prompt, systemMessage, {
        ...options,
        model: AI_CONFIG.fallbackModel,
      });
    }
    
    throw new Error(`AI service unavailable: ${error.message}`);
  }
}

// Helper function for streaming responses
export async function streamOpenAI(
  prompt: string,
  systemMessage?: string,
  onChunk?: (chunk: string) => void,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): Promise<string> {
  try {
    const stream = await openai.chat.completions.create({
      model: options?.model || AI_CONFIG.model,
      messages: [
        ...(systemMessage ? [{ role: 'system' as const, content: systemMessage }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature: options?.temperature || AI_CONFIG.temperature,
      max_tokens: options?.maxTokens || AI_CONFIG.maxTokens,
      stream: true,
    });

    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk?.(content);
      }
    }

    return fullResponse;
  } catch (error: any) {
    console.error('OpenAI Streaming Error:', error);
    throw new Error(`AI streaming service unavailable: ${error.message}`);
  }
}

// Validate OpenAI API key
export function validateOpenAIConfig(): boolean {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY environment variable is not set');
    return false;
  }
  return true;
}

// Test OpenAI connection
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await callOpenAI('Say "Hello" if you can hear me.', undefined, {
      maxTokens: 10,
      temperature: 0,
    });
    return response.toLowerCase().includes('hello');
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}
