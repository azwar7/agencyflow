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
      options.systemPrompt?.includes('Proposal Writer') ||
      options.systemPrompt?.includes('Proposal')
    ) {
      mockPayload = {
        title: 'Digital Transformation & Automated CRM Integration Proposal',
        clientName: 'Valued Client Organization',
        summary: 'Strategic proposal to architect and deploy a modern web application and automated lead ingestion pipeline to double inquiry conversion and eliminate manual CRM entry.',
        scopeOfWork: [
          {
            phase: 'Phase 1: Architecture, Wireframing & UI/UX Design',
            duration: 'Weeks 1–2',
            description: 'Comprehensive workflow mapping, interactive Figma prototypes, component library design, and system architecture blueprint.',
            deliverables: ['Interactive Figma Design System', 'Information Architecture Specification'],
          },
          {
            phase: 'Phase 2: Core Full-Stack Application Engineering',
            duration: 'Weeks 3–4',
            description: 'Next.js responsive web frontend, secure REST API architecture, database schema, and interactive client portal modules.',
            deliverables: ['Production Next.js Web App', 'PostgreSQL Database Integration'],
          },
          {
            phase: 'Phase 3: Automated CRM Ingestion & n8n Pipelines',
            duration: 'Week 5',
            description: 'Multi-channel webhook ingestion, automated lead qualification triggers, and instant CRM synchronization.',
            deliverables: ['n8n Webhook Ingestion Pipeline', 'AI Qualification Trigger System'],
          },
          {
            phase: 'Phase 4: QA Testing, Production Deployment & Staff Training',
            duration: 'Week 6',
            description: 'Comprehensive end-to-end testing, SSL/cloud deployment, security audit, and 2-hour staff onboarding session.',
            deliverables: ['Production Live Deployment', 'Admin Onboarding Video & 30-Day Support'],
          },
        ],
        keyDeliverables: [
          'Full-Stack Next.js Web Application',
          'Automated n8n Ingestion Workflows',
          'PostgreSQL CRM Database Integration',
          '30-Day Post-Launch Technical Support',
        ],
        pricingItems: [
          {
            item: 'UI/UX Design & Architecture Blueprint',
            description: 'Complete user flow mapping, wireframes, and interactive design system',
            price: 6500,
          },
          {
            item: 'Full-Stack Application Development',
            description: 'Next.js frontend, database models, and secure API backend',
            price: 8500,
          },
          {
            item: 'Automated CRM & n8n Workflow Pipelines',
            description: 'Automated lead ingestion, webhook triggers, and multi-channel routing',
            price: 5000,
          },
          {
            item: 'Deployment, Security Audit & Team Training',
            description: 'Production cloud setup, domain DNS, and 2-hour admin walkthrough',
            price: 2500,
          },
        ],
        totalValue: 22500,
        paymentTerms: '50% upfront deposit on contract signing ($11,250), 25% upon Phase 2 milestone review ($5,625), and 25% upon final live deployment ($5,625).',
        estimatedWeeks: 6,
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
