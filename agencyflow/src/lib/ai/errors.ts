import { AiProviderName } from './types';

export type AiErrorCode =
  | 'AI_CONFIG_ERROR'
  | 'AI_AUTH_ERROR'
  | 'AI_PROVIDER_UNAVAILABLE'
  | 'AI_RATE_LIMIT'
  | 'AI_TIMEOUT'
  | 'AI_MALFORMED_OUTPUT'
  | 'AI_VALIDATION_ERROR'
  | 'AI_INTERNAL_ERROR';

/**
 * Strips potential API keys, bearer tokens, or connection strings from error messages.
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return 'Unknown AI error';
  return message
    .replace(/(sk-[a-zA-Z0-9_-]{20,})/gi, '[REDACTED_API_KEY]')
    .replace(/(Bearer\s+[a-zA-Z0-9_.-]{20,})/gi, 'Bearer [REDACTED]')
    .replace(/(key=[a-zA-Z0-9_-]{20,})/gi, 'key=[REDACTED]')
    .replace(/(token=[a-zA-Z0-9_-]{20,})/gi, 'token=[REDACTED]');
}

export abstract class AiBaseError extends Error {
  public abstract readonly code: AiErrorCode;
  public readonly provider?: AiProviderName;
  public readonly retryable: boolean;

  constructor(message: string, provider?: AiProviderName, retryable: boolean = false) {
    super(sanitizeErrorMessage(message));
    this.name = this.constructor.name;
    this.provider = provider;
    this.retryable = retryable;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AiConfigurationError extends AiBaseError {
  public readonly code = 'AI_CONFIG_ERROR';
  constructor(message: string, provider?: AiProviderName) {
    super(message, provider, false);
  }
}

export class AiAuthenticationError extends AiBaseError {
  public readonly code = 'AI_AUTH_ERROR';
  constructor(message: string, provider?: AiProviderName) {
    super(message, provider, false);
  }
}

export class AiProviderUnavailableError extends AiBaseError {
  public readonly code = 'AI_PROVIDER_UNAVAILABLE';
  constructor(message: string, provider?: AiProviderName) {
    super(message, provider, true);
  }
}

export class AiRateLimitError extends AiBaseError {
  public readonly code = 'AI_RATE_LIMIT';
  constructor(message: string, provider?: AiProviderName) {
    super(message, provider, true);
  }
}

export class AiTimeoutError extends AiBaseError {
  public readonly code = 'AI_TIMEOUT';
  constructor(message: string, provider?: AiProviderName) {
    super(message, provider, true);
  }
}

export class AiMalformedOutputError extends AiBaseError {
  public readonly code = 'AI_MALFORMED_OUTPUT';
  public readonly rawOutput?: string;

  constructor(message: string, provider?: AiProviderName, rawOutput?: string) {
    super(message, provider, true);
    this.rawOutput = rawOutput;
  }
}

export class AiValidationError extends AiBaseError {
  public readonly code = 'AI_VALIDATION_ERROR';
  public readonly zodErrors?: unknown;

  constructor(message: string, provider?: AiProviderName, zodErrors?: unknown) {
    super(message, provider, false);
    this.zodErrors = zodErrors;
  }
}

export class AiInternalError extends AiBaseError {
  public readonly code = 'AI_INTERNAL_ERROR';
  constructor(message: string, provider?: AiProviderName) {
    super(message, provider, false);
  }
}
