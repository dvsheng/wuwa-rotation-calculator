import { describe, expect, it } from 'vitest';

import { serializeLogValue } from './server-function-logger';

describe('serverFunctionLogger serialization', () => {
  it('serializes plain objects and bigint values as structured data', () => {
    expect(
      serializeLogValue({
        totalDamage: 1234,
        capabilityId: 99n,
      }),
    ).toMatchObject({
      totalDamage: 1234,
      capabilityId: '99',
    });
  });

  it('serializes errors with useful metadata', () => {
    const serialized = serializeLogValue(new Error('Boom'));

    expect(serialized).toMatchObject({
      type: 'Error',
      name: 'Error',
      message: 'Boom',
    });
  });

  it('serializes form data without throwing', () => {
    const formData = new FormData();
    formData.set('name', 'Sigrika');

    const serialized = serializeLogValue(formData);

    expect(serialized).toMatchObject({
      type: 'FormData',
      entryCount: 1,
    });
    expect(serialized).toHaveProperty('entries');
  });

  it('truncates long nested JSON aggressively', () => {
    const serialized = serializeLogValue({
      team: Array.from({ length: 20 }, (_, index) => ({
        slot: index,
        description: 'x'.repeat(500),
      })),
    });

    expect(serialized).toMatchObject({
      type: 'truncated-json',
      originalType: 'object',
    });
    expect(serialized).toHaveProperty('preview');
    expect(JSON.stringify(serialized).length).toBeLessThanOrEqual(2400);
  });
});
