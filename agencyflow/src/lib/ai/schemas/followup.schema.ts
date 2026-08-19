import { z } from 'zod';

export const FollowupToneEnum = z.enum(['professional', 'urgent', 'executive', 'friendly']);
export type FollowupTone = z.infer<typeof FollowupToneEnum>;

export const FollowupDraftSchema = z.object({
  subject: z.string().min(1).describe('Engaging, context-specific email subject line'),
  body: z.string().min(1).describe('Formatted email body text tailored to the selected tone'),
  tone: FollowupToneEnum.describe('The communication tone applied to this draft'),
  keyTalkingPoints: z.array(z.string()).optional().default([]).describe('Core value propositions or discussion items highlighted in the body'),
});

export type FollowupDraft = z.infer<typeof FollowupDraftSchema>;
