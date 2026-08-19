import { z } from 'zod';

export const CopilotSuggestedActionSchema = z.object({
  label: z.string().describe('User-friendly button or action title'),
  actionType: z.string().describe('Identifier for the suggested CRM workflow or navigation action'),
  payload: z.record(z.unknown()).optional().describe('Action-specific payload parameters'),
});

export const CopilotResponseSchema = z.object({
  answer: z.string().min(1).describe('Direct response to the sales rep or manager query'),
  intent: z.string().describe('Categorized user intent (e.g., query_pipeline, draft_outreach, analyze_deal)'),
  suggestedActions: z.array(CopilotSuggestedActionSchema).default([]).describe('Next recommended workflow actions'),
  confidence: z.number().min(0).max(1).default(0.95).describe('Confidence score for the answer and recommendations'),
});

export type CopilotResponse = z.infer<typeof CopilotResponseSchema>;
export type CopilotSuggestedAction = z.infer<typeof CopilotSuggestedActionSchema>;
