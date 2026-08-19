import { BaseAiProvider } from './base';
import {
  AiProviderName,
  AiGenerationOptions,
  AiGenerationResult,
  AiUsage,
} from '../types';
import {
  AiProviderUnavailableError,
  AiTimeoutError,
  AiRateLimitError,
  AiMalformedOutputError,
} from '../errors';

export class MockAiProvider extends BaseAiProvider {
  public readonly name: AiProviderName = 'mock';

  public isConfigured(): boolean {
    return true;
  }

  public getDefaultModel(): string {
    return 'mock-deterministic-v1';
  }

  public async generateStructured<T>(
    options: AiGenerationOptions<T>
  ): Promise<AiGenerationResult<T>> {
    const startTime = performance.now();

    // 1. Simulate specific failure modes when requested via prompt triggers (for automated testing)
    if (options.userPrompt.includes('SIMULATE_UNAVAILABLE')) {
      throw new AiProviderUnavailableError('Simulated mock provider outage (503 Service Unavailable)', this.name);
    }
    if (options.userPrompt.includes('SIMULATE_TIMEOUT')) {
      throw new AiTimeoutError('Simulated mock request timeout after 10000ms', this.name);
    }
    if (options.userPrompt.includes('SIMULATE_RATE_LIMIT')) {
      throw new AiRateLimitError('Simulated mock rate limit exceeded (429 Too Many Requests)', this.name);
    }
    if (options.userPrompt.includes('SIMULATE_MALFORMED_OUTPUT')) {
      throw new AiMalformedOutputError('Simulated invalid non-JSON output', this.name, 'Plain unparseable text error');
    }

    // 2. Generate deterministic sample response based on known schema shapes or generic mocks
    let mockPayload: unknown;

    if (options.userPrompt.includes('lead') || options.systemPrompt?.includes('lead')) {
      mockPayload = {
        score: 88,
        summary: 'High-value enterprise prospect with verified corporate domain and active executive interest.',
        strengths: [
          'Enterprise corporate domain verified',
          'Multiple active inbound touchpoints',
          'High alignment with custom agency retainer services',
        ],
        risks: [
          'Decision timeline dependent on upcoming Q3 budget approval',
        ],
        recommendedNextAction: 'Schedule a 20-minute executive briefing with senior leadership.',
        confidence: 0.95,
      };
    } else if (options.userPrompt.includes('followup') || options.userPrompt.includes('email') || options.systemPrompt?.includes('email')) {
      mockPayload = {
        subject: 'Executive Briefing & Strategic Growth Roadmap',
        body: 'Thank you for discussing your agency workflow objectives. Based on our review, our team has prepared a tailored rollout plan.',
        tone: options.userPrompt.includes('urgent') ? 'urgent' : options.userPrompt.includes('friendly') ? 'friendly' : 'executive',
        keyTalkingPoints: [
          'End-to-end lead lifecycle tracking',
          'Real-time pipeline analytics',
        ],
      };
    } else if (options.userPrompt.includes('copilot') || options.systemPrompt?.includes('copilot')) {
      mockPayload = {
        answer: 'Your current pipeline value is $185,000 across 6 active enterprise opportunities with a 24.8% win rate.',
        intent: 'query_pipeline_metrics',
        suggestedActions: [
          { label: 'View Pipeline Deals', actionType: 'navigate_pipeline', payload: { view: 'kanban' } },
          { label: 'Draft Follow-ups', actionType: 'open_copilot_draft' },
        ],
        confidence: 0.98,
      };
    } else {
      // Generic fallback for custom schema shapes: generate a valid instance via parseAndValidateJson
      mockPayload = {
        message: 'Mock response generated successfully',
        status: 'success',
      };
    }

    const rawText = JSON.stringify(mockPayload, null, 2);

    // Validate through the provided Zod schema
    const validatedData = this.parseAndValidateJson(rawText, options.schema);

    const usage: AiUsage = {
      promptTokens: 42,
      completionTokens: 85,
      totalTokens: 127,
    };

    return {
      data: validatedData,
      rawText,
      provider: this.name,
      model: options.model || this.getDefaultModel(),
      usage,
      latencyMs: this.getElapsedMs(startTime),
    };
  }
}
