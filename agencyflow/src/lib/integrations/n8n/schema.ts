import { z } from 'zod';

/**
 * Zod Schema for incoming n8n Lead Finder & Qualification payloads.
 * Handles missing fields, nulls, empty strings, and type coercion safely.
 */
export const N8nLeadPayloadSchema = z.object({
  name: z
    .string({ required_error: 'Business or company name is required' })
    .min(1, 'Business or company name cannot be empty')
    .transform((val) => val.trim()),
  address: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  website: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  number: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined) return null;
      const str = String(val).trim();
      return str.length > 0 ? str : null;
    }),
  phone: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  email: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim().toLowerCase() : null)),
  score: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined) return null;
      const num = typeof val === 'number' ? val : parseFloat(val);
      return isNaN(num) ? null : Math.max(0, Math.min(100, num));
    }),
  reason: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  source: z
    .string()
    .optional()
    .default('n8n')
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : 'n8n')),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return null;
      const cleaned = val.trim().replace(/^=+/, '').replace(/^["']|["']$/g, '').trim();
      return cleaned.length > 0 ? cleaned : null;
    }),
  workspaceSlug: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type N8nLeadPayload = z.infer<typeof N8nLeadPayloadSchema>;
