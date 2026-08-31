import { z } from 'zod';

export const EmailGenerationSchema = z.object({
  subject: z
    .string()
    .min(1)
    .max(120)
    .describe('Punchy, conversational email subject line without clickbait or generic spam keywords'),
  body: z
    .string()
    .min(10)
    .describe('Concise, human, personalized email body (75-150 words) structured with greeting, observed problem, tailored value proposition, and low-friction closing'),
  callToAction: z
    .string()
    .min(1)
    .describe('Single clear, low-friction next step (e.g. "Open to seeing a quick 3-minute video breakdown of how this would look for your team?")'),
  recommendedService: z
    .string()
    .min(1)
    .describe('The primary agency service being pitched in this outreach'),
  personalizationPoints: z
    .array(z.string())
    .min(1)
    .describe('Specific verifiable observations from the prospect data used to personalize this email'),
});

export type EmailGeneration = z.infer<typeof EmailGenerationSchema>;
