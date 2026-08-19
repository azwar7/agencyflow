import OpenAI from 'openai';
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

export class OpenAiProvider extends BaseAiProvider {
  public readonly name: AiProviderName = 'openai';
  private client: OpenAI | null = null;

  constructor() {
    super();
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  public isConfigured(): boolean {
    return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0);
  }

  public getDefaultModel(): string {
    return 'gpt-4o-mini';
  }

  public async generateStructured<T>(
    options: AiGenerationOptions<T>
  ): Promise<AiGenerationResult<T>> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AiConfigurationError(
        'OPENAI_API_KEY is not configured in the server environment.',
        this.name
      );
    }

    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }

    const startTime = performance.now();
    const model = options.model || this.getDefaultModel();

    const systemPromptWithJson = [
      options.systemPrompt || 'You are an expert AI sales intelligence engine for AgencyFlow CRM.',
      'CRITICAL: Output valid, parseable JSON only. Do not include markdown code blocks, preamble, or conversational commentary.',
    ].join('\n\n');

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPromptWithJson },
    ];

    if (options.messages && options.messages.length > 0) {
      for (const msg of options.messages) {
        messages.push({
          role: msg.role === 'system' ? 'system' : msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    messages.push({ role: 'user', content: options.userPrompt });

    try {
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1500,
        response_format: { type: 'json_object' },
      });

      const rawText = completion.choices[0]?.message?.content || '';
      const validatedData = this.parseAndValidateJson(rawText, options.schema);

      const usage: AiUsage = {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
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
      this.handleOpenAiError(err);
    }
  }

  private handleOpenAiError(err: any): never {
    if (err instanceof OpenAI.AuthenticationError || err?.status === 401) {
      throw new AiAuthenticationError(
        `OpenAI authentication failed: ${err.message || 'Invalid API key'}`,
        this.name
      );
    }
    if (err instanceof OpenAI.RateLimitError || err?.status === 429) {
      throw new AiRateLimitError(
        `OpenAI rate limit exceeded: ${err.message || 'Too many requests'}`,
        this.name
      );
    }
    if (err instanceof OpenAI.APIConnectionTimeoutError || err?.code === 'ETIMEDOUT') {
      throw new AiTimeoutError(
        `OpenAI request timed out: ${err.message || 'Timeout'}`,
        this.name
      );
    }
    if (err instanceof OpenAI.InternalServerError || (err?.status && err.status >= 500)) {
      throw new AiProviderUnavailableError(
        `OpenAI service is temporarily unavailable: ${err.message || '5xx error'}`,
        this.name
      );
    }
    if (err?.code?.startsWith('AI_')) {
      throw err;
    }
    throw new AiInternalError(
      `OpenAI request failed: ${err?.message || 'Unknown error'}`,
      this.name
    );
  }
}
