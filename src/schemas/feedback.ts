import { z } from 'zod';

export const ReportCapabilityIssueRequestSchema = z.object({
  capabilityId: z.number().int().positive(),
  capabilityName: z.string().trim().min(1).max(200).optional(),
  capabilityDescription: z.string().trim().max(4000).optional(),
  entityId: z.number().int().positive().optional(),
  alternativeDefinition: z.string().trim().min(1).max(32).optional(),
  pageUrl: z.string().trim().url().max(2000).optional(),
  reporter: z.string().trim().max(100).optional(),
  details: z.string().trim().min(10).max(2000),
});

export type ReportCapabilityIssueRequest = z.infer<
  typeof ReportCapabilityIssueRequestSchema
>;

export const ReportCapabilityIssueResponseSchema = z.object({
  success: z.literal(true),
});

export type ReportCapabilityIssueResponse = z.infer<
  typeof ReportCapabilityIssueResponseSchema
>;
