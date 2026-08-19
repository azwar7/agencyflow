import { z } from 'zod';

export type AiProviderName = 'mock' | 'openai' | 'anthropic' | 'gemini' | 'huggingface';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiRequestMetadata {
  workspaceId?: string;
  userId?: string;
  featureName?: string;
  requestId?: string;
  [key: string]: unknown;
}

export interface AiGenerationOptions<T> {
  systemPrompt?: string;
  userPrompt: string;
  messages?: AiMessage[];
  schema: z.ZodType<T>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  metadata?: AiRequestMetadata;
}

export interface AiGenerationResult<T> {
  data: T;
  rawText: string;
  provider: AiProviderName;
  model: string;
  usage: AiUsage;
  latencyMs: number;
}

export interface AiProvider {
  readonly name: AiProviderName;
  isConfigured(): boolean;
  getDefaultModel(): string;
  generateStructured<T>(options: AiGenerationOptions<T>): Promise<AiGenerationResult<T>>;
}

export interface AiServiceConfig {
  defaultProvider: AiProviderName;
  fallbackProvider?: AiProviderName;
  defaultTimeoutMs?: number;
}
