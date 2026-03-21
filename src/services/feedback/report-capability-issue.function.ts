import { createServerFn } from '@tanstack/react-start';

import { ReportCapabilityIssueRequestSchema } from '@/schemas/feedback';

import { reportCapabilityIssueHandler } from './report-capability-issue.server';

export const reportCapabilityIssue = createServerFn({
  method: 'POST',
})
  .inputValidator(ReportCapabilityIssueRequestSchema)
  .handler(async ({ data }) => {
    return reportCapabilityIssueHandler(data);
  });
