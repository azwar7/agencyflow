import {
  AiProvider,
  AiProviderName,
  AiGenerationOptions,
  AiGenerationResult,
  AiServiceConfig,
} from './types';
import {
  AiBaseError,
  AiConfigurationError,
  AiProviderUnavailableError,
} from './errors';
import { MockAiProvider } from './providers/mock';
import { OpenAiProvider } from './providers/openai';
import { AnthropicAiProvider } from './providers/anthropic';
import { GeminiAiProvider } from './providers/gemini';
import { HuggingFaceAiProvider } from './providers/huggingface';

export interface ServiceGenerationOptions<T> extends AiGenerationOptions<T> {
  provider?: AiProviderName;
  fallbackProvider?: AiProviderName;
  allowFallback?: boolean;
}

export class AiService {
  private providers: Map<AiProviderName, AiProvider> = new Map();
  private config: AiServiceConfig;

  constructor(config?: Partial<AiServiceConfig>) {
    // 1. Initialize all provider adapters
    const mock = new MockAiProvider();
    const openai = new OpenAiProvider();
    const anthropic = new AnthropicAiProvider();
    const gemini = new GeminiAiProvider();
    const huggingface = new HuggingFaceAiProvider();

    this.providers.set('mock', mock);
    this.providers.set('openai', openai);
    this.providers.set('anthropic', anthropic);
    this.providers.set('gemini', gemini);
    this.providers.set('huggingface', huggingface);

    // 2. Resolve default provider from environment or configuration
    const envProvider = (process.env.AI_PROVIDER as AiProviderName) || 'mock';
    const envFallback = (process.env.AI_FALLBACK_PROVIDER as AiProviderName) || undefined;

    this.config = {
      defaultProvider: config?.defaultProvider || envProvider,
      fallbackProvider: config?.fallbackProvider || envFallback,
      defaultTimeoutMs: config?.defaultTimeoutMs || 30000,
    };
  }

  /**
   * Retrieves a specific provider adapter by name.
   */
  public getProvider(name: AiProviderName): AiProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new AiConfigurationError(`AI provider "${name}" is not recognized.`);
    }
    return provider;
  }

  /**
   * Checks if a provider has its necessary API keys configured in the environment.
   */
  public isProviderConfigured(name: AiProviderName): boolean {
    const provider = this.providers.get(name);
    return Boolean(provider && provider.isConfigured());
  }

  /**
   * Returns a list of all providers that are currently configured and ready for generation.
   */
  public getConfiguredProviders(): AiProviderName[] {
    const list: AiProviderName[] = [];
    for (const [name, provider] of this.providers.entries()) {
      if (provider.isConfigured()) {
        list.push(name);
      }
    }
    return list;
  }

  public getDefaultProviderName(): AiProviderName {
    return this.config.defaultProvider;
  }

  /**
   * Generates structured output validated against a Zod schema using the configured or specified provider.
   * Gracefully falls back to a secondary provider on retryable infrastructure/availability failures.
   */
  public async generateStructured<T>(
    options: ServiceGenerationOptions<T>
  ): Promise<AiGenerationResult<T>> {
    const requestedProviderName = options.provider || this.config.defaultProvider;
    const fallbackProviderName = options.fallbackProvider || this.config.fallbackProvider;
    const allowFallback = options.allowFallback !== false;

    const primaryProvider = this.getProvider(requestedProviderName);

    try {
      return await primaryProvider.generateStructured(options);
    } catch (primaryError: any) {
      // Determine if fallback is permitted and appropriate
      const isRetryable = primaryError instanceof AiBaseError && primaryError.retryable;
      const canFallback =
        allowFallback &&
        fallbackProviderName &&
        fallbackProviderName !== requestedProviderName &&
        isRetryable;

      if (!canFallback) {
        throw primaryError;
      }

      const fallbackProvider = this.getProvider(fallbackProviderName);
      console.warn(
        `[AiService] Primary provider "${requestedProviderName}" failed with retryable error (${primaryError.code}). Falling back to "${fallbackProviderName}".`
      );

      try {
        return await fallbackProvider.generateStructured(options);
      } catch (fallbackError: any) {
        console.error(
          `[AiService] Fallback provider "${fallbackProviderName}" also failed.`,
          fallbackError
        );
        throw new AiProviderUnavailableError(
          `Both primary (${requestedProviderName}) and fallback (${fallbackProviderName}) providers failed: ${fallbackError.message}`,
          fallbackProviderName
        );
      }
    }
  }
}

// Export singleton instance for app-wide use
export const aiService = new AiService();
