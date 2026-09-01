import { z } from 'zod';

export const ScopePhaseSchema = z.object({
  phase: z.string().min(1).describe('Phase name (e.g. "Phase 1: Discovery & UI/UX Architecture")'),
  duration: z.string().min(1).describe('Estimated timeline (e.g. "Weeks 1–2")'),
  description: z.string().min(1).describe('Comprehensive description of scope tackled in this phase'),
  deliverables: z.array(z.string()).min(1).describe('Concrete tangible deliverables completed in this phase'),
});

export const PricingItemSchema = z.object({
  item: z.string().min(1).describe('Service / module name (e.g. "Modern Web Application Development")'),
  description: z.string().min(1).describe('Detailed breakdown of what is covered in this line item'),
  price: z.number().min(0).describe('Fixed fee for this line item in USD'),
});

export const ProposalGenerationSchema = z.object({
  title: z.string().min(1).describe('Official proposal title (e.g. "Digital Transformation & CRM Automation Proposal")'),
  clientName: z.string().min(1).describe('Client / Organization Name'),
  summary: z.string().min(1).describe('Executive summary detailing client objectives, current challenges, and project goals'),
  scopeOfWork: z.array(ScopePhaseSchema).min(1).describe('Phased implementation roadmap'),
  keyDeliverables: z.array(z.string()).min(1).describe('Summary list of primary deliverables delivered at project completion'),
  pricingItems: z.array(PricingItemSchema).min(1).describe('Itemized investment breakdown'),
  totalValue: z.number().min(0).describe('Total contract investment value in USD (sum of pricing items)'),
  paymentTerms: z.string().min(1).describe('Payment schedule (e.g. "50% upfront deposit, 25% mid-project milestone, 25% upon final deployment")'),
  estimatedWeeks: z.number().int().min(1).default(6).describe('Total estimated project duration in weeks'),
});

export type ScopePhase = z.infer<typeof ScopePhaseSchema>;
export type PricingItem = z.infer<typeof PricingItemSchema>;
export type ProposalGeneration = z.infer<typeof ProposalGenerationSchema>;
