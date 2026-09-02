import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth-session';
import { aiService } from '@/lib/ai/ai-service';

export interface IntegrationStatusItem {
  id: string;
  name: string;
  category: 'Communication' | 'Automation' | 'AI';
  description: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  details?: string;
  lastChecked: string;
  docUrl?: string;
}

export async function GET(request: Request) {
  try {
    await getAuthSession(request);

    const nowIso = new Date().toISOString();

    // 1. Communication: Gmail SMTP
    const hasGmailUser = Boolean(process.env.GMAIL_USER && process.env.GMAIL_USER.trim().length > 0);
    const hasGmailPass = Boolean(process.env.GMAIL_APP_PASSWORD && process.env.GMAIL_APP_PASSWORD.trim().length > 0);
    const gmailConnected = hasGmailUser && hasGmailPass;

    // 2. Communication: Outlook / Office 365
    const hasOutlook = Boolean(process.env.OUTLOOK_CLIENT_ID && process.env.OUTLOOK_CLIENT_SECRET);

    // 3. Automation: n8n Workflow
    const hasN8nUrl = Boolean(process.env.N8N_WEBHOOK_URL && process.env.N8N_WEBHOOK_URL.trim().length > 0);
    const hasN8nSecret = Boolean(process.env.N8N_INTEGRATION_SECRET && process.env.N8N_INTEGRATION_SECRET.trim().length > 0);
    const n8nConnected = hasN8nUrl && hasN8nSecret;

    // 4. AI: Gemini
    const geminiConnected = aiService.isProviderConfigured('gemini');

    // 5. AI: OpenAI
    const openaiConnected = aiService.isProviderConfigured('openai');

    // 6. AI: Anthropic
    const anthropicConnected = aiService.isProviderConfigured('anthropic');

    // 7. AI: HuggingFace
    const huggingfaceConnected = aiService.isProviderConfigured('huggingface');

    const integrations: IntegrationStatusItem[] = [
      {
        id: 'gmail',
        name: 'Google Workspace / Gmail',
        category: 'Communication',
        description: 'Outbound B2B cold email delivery & OTP security verification via Google App Password SMTP.',
        status: gmailConnected ? 'CONNECTED' : 'NOT_CONFIGURED',
        details: gmailConnected
          ? `Connected as ${process.env.GMAIL_USER?.trim()}`
          : 'GMAIL_USER or GMAIL_APP_PASSWORD missing in server environment',
        lastChecked: nowIso,
      },
      {
        id: 'outlook',
        name: 'Microsoft 365 / Outlook',
        category: 'Communication',
        description: 'Enterprise mail exchange and calendar synchronizer for executive outreach.',
        status: hasOutlook ? 'CONNECTED' : 'NOT_CONFIGURED',
        details: hasOutlook ? 'Configured via Azure AD OAuth' : 'OUTLOOK_CLIENT_ID not configured',
        lastChecked: nowIso,
      },
      {
        id: 'n8n',
        name: 'n8n Workflow Engine',
        category: 'Automation',
        description: 'Bidirectional webhook automation for multi-channel lead scraping, enrichment, and CRM sync.',
        status: n8nConnected ? 'CONNECTED' : 'NOT_CONFIGURED',
        details: n8nConnected
          ? `Webhook: ${process.env.N8N_WEBHOOK_URL?.split('/webhook')[0]}/...`
          : 'N8N_WEBHOOK_URL or N8N_INTEGRATION_SECRET not configured',
        lastChecked: nowIso,
      },
      {
        id: 'gemini',
        name: 'Google Gemini 2.5',
        category: 'AI',
        description: 'High-speed structured lead analysis, qualification scoring, and proposal pitch generation.',
        status: geminiConnected ? 'CONNECTED' : 'NOT_CONFIGURED',
        details: geminiConnected ? 'Active model: gemini-2.5-flash' : 'GEMINI_API_KEY not configured',
        lastChecked: nowIso,
      },
      {
        id: 'openai',
        name: 'OpenAI GPT-4o',
        category: 'AI',
        description: 'Natural language tone calibration and automated outreach copywriter.',
        status: openaiConnected ? 'CONNECTED' : 'NOT_CONFIGURED',
        details: openaiConnected ? 'Active model: gpt-4o-mini' : 'OPENAI_API_KEY not configured',
        lastChecked: nowIso,
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude 3.5',
        category: 'AI',
        description: 'Nuanced client context synthesis and long-form proposal evaluation.',
        status: anthropicConnected ? 'CONNECTED' : 'NOT_CONFIGURED',
        details: anthropicConnected ? 'Active model: claude-3-5-sonnet-20241022' : 'ANTHROPIC_API_KEY not configured',
        lastChecked: nowIso,
      },
      {
        id: 'huggingface',
        name: 'Hugging Face Inference',
        category: 'AI',
        description: 'Open-weights LLM inference for domain-specific lead qualification.',
        status: huggingfaceConnected ? 'CONNECTED' : 'NOT_CONFIGURED',
        details: huggingfaceConnected ? 'Active model: Qwen/Qwen2.5-72B-Instruct' : 'HUGGINGFACE_API_KEY not configured',
        lastChecked: nowIso,
      },
    ];

    return NextResponse.json({
      success: true,
      data: integrations,
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
