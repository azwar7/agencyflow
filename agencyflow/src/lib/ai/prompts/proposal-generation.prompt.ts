export const PROPOSAL_GENERATION_PROMPT_VERSION = 'v1.0';

export interface ProposalPromptOptions {
  agencyName?: string;
  clientName: string;
  contactPerson?: string;
  companyDescription?: string;
  painPoints?: string[];
  recommendedServices?: string[];
  recommendedPitch?: string;
  budget?: number;
  timelineWeeks?: number;
  customScope?: string;
}

export interface ProposalPromptResult {
  systemPrompt: string;
  userPrompt: string;
  version: string;
}

/**
 * Builds a structured, high-conversion B2B agency proposal prompt.
 */
export function buildProposalGenerationPrompt(
  options: ProposalPromptOptions
): ProposalPromptResult {
  const agencyName = options.agencyName || 'AgencyFlow';
  const clientName = options.clientName || 'Valued Client';
  const budget = options.budget || 24000;
  const timelineWeeks = options.timelineWeeks || 6;

  const systemPrompt = `You are an elite Senior Agency Solutions Architect and Executive Proposal Writer for ${agencyName}.
You craft high-converting, professional B2B client proposals, Statement of Work (SOW) documents, and project implementation roadmaps.

PROPOSAL DIRECTIVES:
1. EXECUTIVE SUMMARY: Articulate the client's commercial challenge, their revenue/operational upside, and our proposed architectural solution with utmost clarity.
2. STRUCTURED SCOPE OF WORK: Organize implementation into 3–4 logical phases (e.g. Phase 1: Architecture & UI/UX Design, Phase 2: Core Engineering & Modules, Phase 3: Workflow Automation & Integrations, Phase 4: QA Testing, Deployment & Staff Training).
3. CONCRETE DELIVERABLES: List specific tangible deliverables (codebases, automated pipelines, design systems, documentation).
4. ITEMIZED PRICING: Provide realistic, professional itemized line items. The sum of item prices MUST equal totalValue.
5. MILESTONE TERMS: Standard agency terms: 50% deposit upon contract signing, 25% at mid-project milestone review, 25% upon final QA & deployment.

OUTPUT JSON FORMAT REQUIREMENTS:
You MUST respond with a JSON object conforming strictly to this exact shape:
{
  "title": "Comprehensive Web Application & CRM Automation Proposal",
  "clientName": "${clientName}",
  "summary": "Executive summary paragraph...",
  "scopeOfWork": [
    {
      "phase": "Phase 1: Architecture & UI/UX Design",
      "duration": "Weeks 1–2",
      "description": "Detailed phase description...",
      "deliverables": ["Interactive Figma Prototypes", "System Architecture Blueprint"]
    },
    {
      "phase": "Phase 2: Core Development & Engineering",
      "duration": "Weeks 3–4",
      "description": "Detailed phase description...",
      "deliverables": ["Frontend App", "API Backend & Database"]
    }
  ],
  "keyDeliverables": [
    "Production Next.js Web Application",
    "Automated n8n Integration Pipelines",
    "Admin Dashboard & CRM Integration",
    "30-Day Post-Launch Technical Support"
  ],
  "pricingItems": [
    {
      "item": "Core Application Architecture & Design",
      "description": "Full UI/UX design, wireframing, and component library",
      "price": ${Math.round(budget * 0.35)}
    },
    {
      "item": "Full-Stack Development & CRM Integration",
      "description": "Database schema, API integration, and automated n8n workflows",
      "price": ${Math.round(budget * 0.45)}
    },
    {
      "item": "Deployment, Security & Team Training",
      "description": "Cloud hosting setup, SSL, CI/CD pipeline, and 2-hour staff training",
      "price": ${budget - Math.round(budget * 0.35) - Math.round(budget * 0.45)}
    }
  ],
  "totalValue": ${budget},
  "paymentTerms": "50% upfront deposit on contract signing, 25% upon Phase 2 milestone review, 25% upon final deployment & delivery.",
  "estimatedWeeks": ${timelineWeeks}
}

Output ONLY valid, parseable JSON conforming to this schema.`;

  const userPrompt = `Generate a high-converting agency project proposal for the following client:

### CLIENT_INFORMATION
- Client Name / Company: ${clientName}
- Contact Person: ${options.contactPerson || 'Executive Team'}
- Company Overview: ${options.companyDescription || 'Established business scaling digital operations.'}

### DIAGNOSED_PAIN_POINTS
${options.painPoints && options.painPoints.length > 0 ? options.painPoints.map((p) => `- ${p}`).join('\n') : '- Manual workflows and unoptimized digital lead conversion pathways.'}

### RECOMMENDED_AGENCY_SERVICES
${options.recommendedServices && options.recommendedServices.length > 0 ? options.recommendedServices.map((s) => `- ${s}`).join('\n') : '- Modern Web Application\n- Automated CRM Ingestion\n- Workflow Automations'}

### STRATEGIC_PITCH
${options.recommendedPitch || 'Deploy modern automated digital infrastructure to scale revenue velocity.'}

### BUDGET_AND_TIMELINE
- Target Budget: $${budget.toLocaleString()} USD
- Target Timeline: ${timelineWeeks} Weeks

${options.customScope ? `### CUSTOM_CLIENT_REQUIREMENTS\n${options.customScope}\n` : ''}

Generate a complete, structured proposal in valid JSON matching the schema.`;

  return {
    systemPrompt,
    userPrompt,
    version: PROPOSAL_GENERATION_PROMPT_VERSION,
  };
}
