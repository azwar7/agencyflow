import { HfInference } from '@huggingface/inference';
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

export class HuggingFaceAiProvider extends BaseAiProvider {
  public readonly name: AiProviderName = 'huggingface';
  private client: HfInference | null = null;

  constructor() {
    super();
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (apiKey) {
      this.client = new HfInference(apiKey);
    }
  }

  public isConfigured(): boolean {
    return Boolean(process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.trim().length > 0);
  }

  public getDefaultModel(): string {
    return 'meta-llama/Meta-Llama-3-8B-Instruct';
  }

  public async generateStructured<T>(
    options: AiGenerationOptions<T>
  ): Promise<AiGenerationResult<T>> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new AiConfigurationError(
        'HUGGINGFACE_API_KEY is not configured in the server environment.',
        this.name
      );
    }

    if (!this.client) {
      this.client = new HfInference(apiKey);
    }

    const startTime = performance.now();
    const model = options.model || this.getDefaultModel();

    const systemPrompt = [
      options.systemPrompt || 'You are an expert AI sales intelligence engine for AgencyFlow CRM.',
      'CRITICAL: Return valid, parseable JSON only. Do not format with markdown code blocks (```json) or conversational text.',
    ].join('\n\n');

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    if (options.messages && options.messages.length > 0) {
      for (const msg of options.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: options.userPrompt });

    try {
      const response = await this.client.chatCompletion({
        model,
        messages,
        max_tokens: options.maxTokens ?? 1500,
        temperature: options.temperature ?? 0.2,
      });

      const rawText = response.choices[0]?.message?.content || '';
      const validatedData = this.parseAndValidateJson(rawText, options.schema);

      const usage: AiUsage = {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
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
      this.handleHuggingFaceError(err);
    }
  }

  private handleHuggingFaceError(err: any): never {
    const msg = err?.message || '';
    const status = err?.status || err?.statusCode;

    if (status === 401 || status === 403 || msg.includes('authorization') || msg.includes('Invalid credentials') || msg.includes('token')) {
      throw new AiAuthenticationError(
        `Hugging Face authentication failed: ${msg || 'Invalid API token'}`,
        this.name
      );
    }
    if (status === 429 || msg.includes('rate limit') || msg.includes('exceeded')) {
      throw new AiRateLimitError(
        `Hugging Face rate limit exceeded: ${msg || 'Too many requests'}`,
        this.name
      );
    }
    if (msg.includes('timeout') || err?.code === 'ETIMEDOUT') {
      throw new AiTimeoutError(
        `Hugging Face request timed out: ${msg || 'Timeout'}`,
        this.name
      );
    }
    if (status >= 500 || msg.includes('loading') || msg.includes('unavailable') || msg.includes('503')) {
      throw new AiProviderUnavailableError(
        `Hugging Face service is temporarily unavailable: ${msg || 'Service unavailable'}`,
        this.name
      );
    }
    if (err?.code?.startsWith('AI_')) {
      throw err;
    }
    throw new AiInternalError(
      `Hugging Face request failed: ${msg || 'Unknown error'}`,
      this.name
    );
  }
}
