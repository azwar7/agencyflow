import { z } from 'zod';

export const LeadAnalysisSchema = z.object({
  score: z.number().int().min(0).max(100).describe('Lead qualification score between 0 and 100'),
  summary: z.string().min(1).describe('Executive summary of the lead evaluation'),
  strengths: z.array(z.string()).describe('Identified conversion drivers and high-intent indicators'),
  risks: z.array(z.string()).describe('Potential deal risks, cold signals, or qualification blockers'),
  recommendedNextAction: z.string().min(1).describe('Specific tactical next step recommended for the sales rep'),
  confidence: z.number().min(0).max(1).default(0.9).describe('Model confidence score from 0.0 to 1.0'),
});

export type LeadAnalysis = z.infer<typeof LeadAnalysisSchema>;
