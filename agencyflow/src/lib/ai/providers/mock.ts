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

    if (
      options.systemPrompt?.includes('Strategy & Lead Intelligence Analyst') ||
      options.systemPrompt?.includes('diagnostic')
    ) {
      mockPayload = {
        score: 85,
        qualification: 'hot',
        companySummary: 'Established business with active commercial operations and significant digital automation opportunities.',
        likelyPainPoints: [
          'Manual lead qualification and intake bottlenecks',
          'Lack of automated CRM integration and immediate follow-ups',
          'Outdated landing page conversion pathways',
        ],
        recommendedServices: [
          'Modern High-Converting Web Application',
          'Automated CRM Ingestion & Multi-Channel Intake',
          'Workflow Automation Pipelines',
        ],
        recommendedPitch: 'Deploy automated 24/7 lead intake and instant CRM integration to eliminate inquiry loss and double sales velocity.',
        reasoning: 'Established operational footprint with clear, high-ROI leverage for custom digital systems and workflow automation.',
        confidence: 90,
      };
    } else if (
      options.systemPrompt?.includes('Cold Outreach Copywriter') ||
      options.systemPrompt?.includes('personalized outreach email')
    ) {
      mockPayload = {
        subject: 'Quick question regarding lead automation for your team',
        body: 'Hi Sarah,\n\nSaw your team is expanding operations. Many growing agencies lose up to 35% of inbound inquiries due to manual booking and delayed follow-ups.\n\nWe built an automated CRM intake pipeline that captures and qualifies inbound prospects in under 60 seconds.\n\nAre you open to a quick 3-minute video showing how this would look for your workflow?\n\nBest,\nAlex',
        callToAction: 'Are you open to a quick 3-minute video showing how this would look for your workflow?',
        recommendedService: 'Automated CRM Ingestion & Intake Flow',
        personalizationPoints: [
          'Expanding business operations footprint',
          'Opportunity to automate 24/7 inbound inquiry capture',
        ],
      };
    } else if (options.userPrompt.includes('lead') || options.systemPrompt?.includes('lead')) {
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
