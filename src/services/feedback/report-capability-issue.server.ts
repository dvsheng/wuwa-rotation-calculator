import type {
  ReportCapabilityIssueRequest,
  ReportCapabilityIssueResponse,
} from '@/schemas/feedback';

const MAX_DISCORD_FIELD_LENGTH = 1024;
const MAX_DISCORD_DESCRIPTION_LENGTH = 4096;

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
};

const toField = (name: string, value: string, inline = false) => ({
  name,
  value: truncate(value, MAX_DISCORD_FIELD_LENGTH),
  inline,
});

const buildDiscordPayload = (input: ReportCapabilityIssueRequest) => {
  const capabilityLabel = input.capabilityName
    ? `${input.capabilityName} (#${input.capabilityId})`
    : `#${input.capabilityId}`;
  const fields = [
    toField('Capability', capabilityLabel),
    toField('Reporter', input.reporter || 'Anonymous', true),
    toField('Alternative Definition', input.alternativeDefinition || 'Base', true),
  ];

  if (input.entityId) {
    fields.push(toField('Entity ID', String(input.entityId), true));
  }

  if (input.pageUrl) {
    fields.push(toField('Page', input.pageUrl));
  }

  if (input.capabilityDescription) {
    fields.push(toField('Capability Description', input.capabilityDescription));
  }

  return {
    embeds: [
      {
        title: 'Capability issue report',
        color: 15_233_235,
        description: truncate(input.details, MAX_DISCORD_DESCRIPTION_LENGTH),
        fields,
        timestamp: new Date().toISOString(),
      },
    ],
  };
};

export const reportCapabilityIssueHandler = async (
  input: ReportCapabilityIssueRequest,
): Promise<ReportCapabilityIssueResponse> => {
  const webhookUrl = process.env.DISCORD_CAPABILITY_ISSUE_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('DISCORD_CAPABILITY_ISSUE_WEBHOOK_URL is not configured');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildDiscordPayload(input)),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    console.error('Failed to send capability issue report to Discord', {
      status: response.status,
      statusText: response.statusText,
      errorBody,
    });

    throw new Error('Failed to send capability issue report');
  }

  return { success: true };
};
