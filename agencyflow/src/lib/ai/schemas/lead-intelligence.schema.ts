import { z } from 'zod';

export const LeadIntelligenceSchema = z.object({
  score: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe('Objective commercial viability score from 0 to 100 based on digital fit, apparent business size, and agency alignment'),
  qualification: z
    .enum(['hot', 'warm', 'cold'])
    .describe('Categorical qualification tier based on urgency and revenue opportunity'),
  companySummary: z
    .string()
    .min(1)
    .describe('Precise 1-2 sentence breakdown of what this company does and their current market presence'),
  likelyPainPoints: z
    .array(z.string())
    .min(1)
    .describe('List of specific digital, operational, lead-generation, or branding bottlenecks the business faces'),
  recommendedServices: z
    .array(z.string())
    .min(1)
    .describe('List of our agency services best suited to solve their bottlenecks (e.g. Modern Web App, Automated CRM Ingestion, SEO Lead Capture)'),
  recommendedPitch: z
    .string()
    .min(1)
    .describe('Compelling, specific value proposition explaining exactly how we help them increase revenue or efficiency'),
  reasoning: z
    .string()
    .min(1)
    .describe('Transparent, explainable breakdown of the score factors and commercial evaluation'),
  confidence: z
    .number()
    .int()
    .min(0)
    .max(100)
    .default(85)
    .describe('AI confidence percentage in this assessment based on available data'),
});

export type LeadIntelligence = z.infer<typeof LeadIntelligenceSchema>;
