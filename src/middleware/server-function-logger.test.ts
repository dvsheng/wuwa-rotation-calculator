import { describe, expect, it } from 'vitest';

import { serializeLogValue } from './server-function-logger';

describe('serverFunctionLogger serialization', () => {
  it('serializes plain objects and bigint values', () => {
    expect(
      serializeLogValue({
        totalDamage: 1234,
        capabilityId: 99n,
      }),
    ).toContain('"capabilityId": "99"');
  });

  it('serializes errors with useful metadata', () => {
    const serialized = serializeLogValue(new Error('Boom'));

    expect(serialized).toContain('"name": "Error"');
    expect(serialized).toContain('"message": "Boom"');
  });

  it('serializes form data without throwing', () => {
    const formData = new FormData();
    formData.set('name', 'Sigrika');

    const serialized = serializeLogValue(formData);

    expect(serialized).toContain('"type": "FormData"');
    expect(serialized).toContain('"name"');
    expect(serialized).toContain('"Sigrika"');
  });
});
