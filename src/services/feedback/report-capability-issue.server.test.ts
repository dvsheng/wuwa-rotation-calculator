import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReportCapabilityIssueRequest } from '@/schemas/feedback';

const fetchMock = vi.fn();
const originalWebhookUrl = process.env.DISCORD_CAPABILITY_ISSUE_WEBHOOK_URL;
const webhookUrl =
  'https://discord.com/api/webhooks/test/test-discord-capability-issue-webhook';

const input: ReportCapabilityIssueRequest = {
  capabilityId: 42,
  capabilityName: 'Harmonic Slash',
  capabilityDescription: 'Deals Spectro DMG and grants a small buff.',
  entityId: 7,
  alternativeDefinition: 'resonanceSkill',
  pageUrl: 'https://example.com/entities/7?capabilityId=42',
  reporter: 'david',
  details: 'The motion value looks too low compared to the in-game tooltip.',
};

describe('reportCapabilityIssueHandler', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    process.env.DISCORD_CAPABILITY_ISSUE_WEBHOOK_URL = webhookUrl;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalWebhookUrl === undefined) {
      delete process.env.DISCORD_CAPABILITY_ISSUE_WEBHOOK_URL;
    } else {
      process.env.DISCORD_CAPABILITY_ISSUE_WEBHOOK_URL = originalWebhookUrl;
    }
  });

  it('posts the report to the Discord webhook', async () => {
    const { reportCapabilityIssueHandler } =
      await import('./report-capability-issue.server');

    fetchMock.mockResolvedValue(new Response(undefined, { status: 204 }));

    await expect(reportCapabilityIssueHandler(input)).resolves.toEqual({
      success: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(webhookUrl);
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      embeds: [
        {
          title: 'Capability issue report',
          description: input.details,
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'Capability',
              value: 'Harmonic Slash (#42)',
            }),
            expect.objectContaining({
              name: 'Reporter',
              value: 'david',
            }),
            expect.objectContaining({
              name: 'Alternative Definition',
              value: 'resonanceSkill',
            }),
            expect.objectContaining({
              name: 'Entity ID',
              value: '7',
            }),
            expect.objectContaining({
              name: 'Page',
              value: input.pageUrl,
            }),
          ]),
        },
      ],
    });
  });

  it('throws when Discord rejects the request', async () => {
    const { reportCapabilityIssueHandler } =
      await import('./report-capability-issue.server');

    fetchMock.mockResolvedValue(
      new Response('nope', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    await expect(reportCapabilityIssueHandler(input)).rejects.toThrow(
      'Failed to send capability issue report',
    );
  });

  it('throws when the webhook URL is not configured', async () => {
    const { reportCapabilityIssueHandler } =
      await import('./report-capability-issue.server');

    delete process.env.DISCORD_CAPABILITY_ISSUE_WEBHOOK_URL;

    await expect(reportCapabilityIssueHandler(input)).rejects.toThrow(
      'DISCORD_CAPABILITY_ISSUE_WEBHOOK_URL is not configured',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
