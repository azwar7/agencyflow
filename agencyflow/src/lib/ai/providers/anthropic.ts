import Anthropic from '@anthropic-ai/sdk';
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

export class AnthropicAiProvider extends BaseAiProvider {
  public readonly name: AiProviderName = 'anthropic';
  private client: Anthropic | null = null;

  constructor() {
    super();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  public isConfigured(): boolean {
    return Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0);
  }

  public getDefaultModel(): string {
    return 'claude-3-5-sonnet-20241022';
  }

  public async generateStructured<T>(
    options: AiGenerationOptions<T>
  ): Promise<AiGenerationResult<T>> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new AiConfigurationError(
        'ANTHROPIC_API_KEY is not configured in the server environment.',
        this.name
      );
    }

    if (!this.client) {
      this.client = new Anthropic({ apiKey });
    }

    const startTime = performance.now();
    const model = options.model || this.getDefaultModel();

    const systemPrompt = [
      options.systemPrompt || 'You are an expert AI sales intelligence engine for AgencyFlow CRM.',
      'CRITICAL: Respond ONLY with valid, RFC-8259 compliant JSON. Do not include markdown code block formatting (```json), commentary, or explanation outside the JSON object.',
    ].join('\n\n');

    const messages: Anthropic.MessageParam[] = [];

    if (options.messages && options.messages.length > 0) {
      for (const msg of options.messages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: options.userPrompt });

    try {
      const response = await this.client.messages.create({
        model,
        system: systemPrompt,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 1500,
      });

      let rawText = '';
      if (response.content && response.content.length > 0) {
        const textBlock = response.content[0];
        if (textBlock && textBlock.type === 'text') {
          rawText = textBlock.text;
        }
      }

      const validatedData = this.parseAndValidateJson(rawText, options.schema);

      const usage: AiUsage = {
        promptTokens: response.usage?.input_tokens ?? 0,
        completionTokens: response.usage?.output_tokens ?? 0,
        totalTokens: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
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
      this.handleAnthropicError(err);
    }
  }

  private handleAnthropicError(err: any): never {
    if (err instanceof Anthropic.AuthenticationError || err?.status === 401) {
      throw new AiAuthenticationError(
        `Anthropic authentication failed: ${err.message || 'Invalid API key'}`,
        this.name
      );
    }
    if (err instanceof Anthropic.RateLimitError || err?.status === 429) {
      throw new AiRateLimitError(
        `Anthropic rate limit exceeded: ${err.message || 'Too many requests'}`,
        this.name
      );
    }
    if (err instanceof Anthropic.APIConnectionTimeoutError || err?.code === 'ETIMEDOUT') {
      throw new AiTimeoutError(
        `Anthropic request timed out: ${err.message || 'Timeout'}`,
        this.name
      );
    }
    if (err instanceof Anthropic.InternalServerError || (err?.status && err.status >= 500)) {
      throw new AiProviderUnavailableError(
        `Anthropic service is temporarily unavailable: ${err.message || '5xx error'}`,
        this.name
      );
    }
    if (err?.code?.startsWith('AI_')) {
      throw err;
    }
    throw new AiInternalError(
      `Anthropic request failed: ${err?.message || 'Unknown error'}`,
      this.name
    );
  }
}
