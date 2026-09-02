import { LeadContext } from '../context/lead-context';
import { LeadIntelligence } from '../schemas/lead-intelligence.schema';

export const EMAIL_GENERATION_PROMPT_VERSION = 'v2.0';

export interface EmailGenerationPromptOptions {
  context: LeadContext;
  intelligence?: LeadIntelligence | null;
  tone?: 'professional' | 'conversational' | 'direct';
  customInstructions?: string;
  senderName?: string;
  agencyName?: string;
}

export interface EmailGenerationPromptResult {
  systemPrompt: string;
  userPrompt: string;
  version: string;
}

/**
 * Builds a personalized, human-sounding B2B outreach email prompt
 * strictly adhering to anti-spam, high-conversion principles.
 */
export function buildEmailGenerationPrompt(
  options: EmailGenerationPromptOptions
): EmailGenerationPromptResult {
  const tone = options.tone || 'professional';
  const agencyName = options.agencyName || 'AgencyFlow';
  const senderName = options.senderName || 'Account Representative';

  const systemPrompt = `You are a world-class B2B Cold Outreach Copywriter for ${agencyName}.
You write authentic, concise, highly personalized outreach emails from agency founder/rep (${senderName}) to prospective business decision-makers.

CRITICAL COPYWRITING RULES:
1. HUMAN & AUTHENTIC: Write like a real human writing a 1-to-1 email. Never sound like automated sales templates.
2. NO SPAM CLICHES: Never use generic openings like "I hope this email finds you well", "I came across your profile", "quick question", "synergy", or "revolutionary".
3. CONCISE & RESPECTFUL: Keep the body between 75 and 150 words. Decision-makers read on mobile in under 20 seconds.
4. PROBLEM & VALUE FOCUSED: Anchor the email on their specific business bottleneck and the tailored value proposition.
5. NO FAKE CLAIMS OR FAKE STATS: Never invent fake statistics ("we increased client revenue by 847%"), fake awards, or pretend you spent days analyzing their internal codebase if you didn't.
6. ZERO EXCESSIVE FLATTERY: Avoid exaggerated praise ("Your incredible world-leading enterprise"). Be grounded, respectful, and observational.
7. SINGLE LOW-FRICTION CTA: End with one clear, non-pushy conversational question (e.g., "Are you open to a 3-minute video breakdown of how we'd implement this for ${options.context.lead.companyName || 'your business'}?").
8. TONE ADAPTATION:
   - "professional": Polished, articulate, executive tone.
   - "conversational": Warm, peer-to-peer, relaxed yet sharp.
   - "direct": Ultra-concise, gets to the point in 3-4 sentences.

OUTPUT JSON FORMAT REQUIREMENTS:
You MUST respond with a JSON object conforming strictly to this exact shape:
{
  "subject": "Clear, compelling email subject line without spam words",
  "body": "Hi [Name],\n\nConcise 75-150 word email body...\n\nBest,\n[Sender]",
  "callToAction": "Single low-friction closing question",
  "recommendedService": "Primary agency service pitched",
  "personalizationPoints": ["Specific observation 1", "Specific observation 2"]
}

Output ONLY valid, parseable JSON conforming strictly to this shape.`;

  const userPrompt = `Draft a personalized outreach email for the following prospect:

### PROSPECT_DATA
- Contact Name: ${options.context.lead.fullName || options.context.lead.firstName || 'Business Owner'}
- Company: ${options.context.lead.companyName || 'Your Business'}
- Website: ${options.context.company?.domain || options.context.lead.email || 'Online'}
- Status: ${options.context.lead.status}
- Source: ${options.context.lead.source}

### AI_INTELLIGENCE_DIAGNOSTIC
${
  options.intelligence
    ? JSON.stringify(options.intelligence, null, 2)
    : `Summary: ${options.context.lead.aiSummary || 'Established business with potential digital automation opportunities.'}\nScore: ${options.context.lead.leadScore}/100`
}

### DESIRED_TONE
${tone}

${
  options.customInstructions
    ? `### CUSTOM_INSTRUCTIONS\n${options.customInstructions}\n### END_CUSTOM_INSTRUCTIONS\n`
    : ''
}

Generate a high-converting, personalized outreach email in strict JSON format matching the schema.`;

  return {
    systemPrompt,
    userPrompt,
    version: EMAIL_GENERATION_PROMPT_VERSION,
  };
}
