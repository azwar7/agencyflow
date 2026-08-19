import { z } from 'zod';
import {
  AiProvider,
  AiProviderName,
  AiGenerationOptions,
  AiGenerationResult,
} from '../types';
import {
  AiMalformedOutputError,
  AiValidationError,
} from '../errors';

export abstract class BaseAiProvider implements AiProvider {
  public abstract readonly name: AiProviderName;

  public abstract isConfigured(): boolean;
  public abstract getDefaultModel(): string;
  public abstract generateStructured<T>(
    options: AiGenerationOptions<T>
  ): Promise<AiGenerationResult<T>>;

  /**
   * Robustly extracts, parses, and validates JSON from raw model output.
   * Handles markdown code blocks (```json ... ```) and leading/trailing chatter.
   */
  protected parseAndValidateJson<T>(
    rawText: string,
    schema: z.ZodType<T>
  ): T {
    if (!rawText || typeof rawText !== 'string') {
      throw new AiMalformedOutputError(
        'Model returned an empty or invalid response.',
        this.name,
        rawText
      );
    }

    let cleaned = rawText.trim();

    // 1. Strip markdown code fences if present
    const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (markdownMatch && markdownMatch[1]) {
      cleaned = markdownMatch[1].trim();
    } else {
      // 2. Locate first '{' or '[' and last '}' or ']'
      const firstBrace = cleaned.search(/[\{\[]/);
      const lastBrace = cleaned.search(/[\}\]][^}]*$/);
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (parseErr: any) {
      throw new AiMalformedOutputError(
        `Failed to parse model output as JSON: ${parseErr.message}`,
        this.name,
        rawText
      );
    }

    const validation = schema.safeParse(parsedJson);
    if (!validation.success) {
      throw new AiValidationError(
        `Model output failed schema validation: ${validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        this.name,
        validation.error.format()
      );
    }

    return validation.data;
  }

  protected getElapsedMs(startTime: number): number {
    return Math.round(performance.now() - startTime);
  }
}
