import { GoogleGenAI } from '@google/genai';
import { BaseAiProvider } from './base';
import {
  AiProviderName,
  AiGenerationOptions,
  AiGenerationResult,
  AiUsage,
} from '../types';
import {
  AiConfigurationError,
  AiAuthenticationError,
  AiRateLimitError,
  AiProviderUnavailableError,
  AiTimeoutError,
  AiInternalError,
} from '../errors';

export class GeminiAiProvider extends BaseAiProvider {
  public readonly name: AiProviderName = 'gemini';
  private client: GoogleGenAI | null = null;

  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  public isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  }

  public getDefaultModel(): string {
    return 'gemini-2.5-flash';
  }

  public async generateStructured<T>(
    options: AiGenerationOptions<T>
  ): Promise<AiGenerationResult<T>> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new AiConfigurationError(
        'GEMINI_API_KEY is not configured in the server environment.',
        this.name
      );
    }

    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey });
    }

    const startTime = performance.now();
    const model = options.model || this.getDefaultModel();

    const systemInstruction = [
      options.systemPrompt || 'You are an expert AI sales intelligence engine for AgencyFlow CRM.',
      'CRITICAL: Return valid parseable JSON only. Do not format with markdown fences or extra explanations.',
    ].join('\n\n');

    try {
      const response = await this.client.models.generateContent({
        model,
        contents: options.userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxTokens ?? 1500,
        },
      });

      const rawText = response.text || '';
      const validatedData = this.parseAndValidateJson(rawText, options.schema);

      const usageMetadata = response.usageMetadata;
      const usage: AiUsage = {
        promptTokens: usageMetadata?.promptTokenCount ?? 0,
        completionTokens: usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: usageMetadata?.totalTokenCount ?? 0,
      };

      return {
        data: validatedData,
        rawText,
        provider: this.name,
        model,
        usage,
        latencyMs: this.getElapsedMs(startTime),
      };
    } catch (err: any) {
      this.handleGeminiError(err);
    }
  }

  private handleGeminiError(err: any): never {
    const msg = err?.message || '';
    const status = err?.status || err?.code;

    if (status === 401 || status === 403 || msg.includes('API_KEY_INVALID') || msg.includes('unauthorized') || msg.includes('API key not valid')) {
      throw new AiAuthenticationError(
        `Gemini authentication failed: ${msg || 'Invalid API key'}`,
        this.name
      );
    }
    if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('rate limit')) {
      throw new AiRateLimitError(
        `Gemini rate limit exceeded: ${msg || 'Quota exhausted'}`,
        this.name
      );
    }
    if (msg.includes('DEADLINE_EXCEEDED') || msg.includes('timeout') || err?.code === 'ETIMEDOUT') {
      throw new AiTimeoutError(
        `Gemini request timed out: ${msg || 'Timeout'}`,
        this.name
      );
    }
    if (status >= 500 || msg.includes('UNAVAILABLE') || msg.includes('INTERNAL')) {
      throw new AiProviderUnavailableError(
        `Gemini service is temporarily unavailable: ${msg || '5xx error'}`,
        this.name
      );
    }
    if (err?.code?.startsWith('AI_')) {
      throw err;
    }
    throw new AiInternalError(
      `Gemini request failed: ${msg || 'Unknown error'}`,
      this.name
    );
  }
}
