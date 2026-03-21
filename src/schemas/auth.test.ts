import { describe, expect, it } from 'vitest';

import { PasswordSignUpSchema, buildTemporaryEmailFromUsername } from './auth';

describe('auth schema helpers', () => {
  it('builds a temporary email from the username', () => {
    expect(buildTemporaryEmailFromUsername('Rover_123')).toBe(
      'Rover_123@tempemail.com',
    );
  });

  it('validates password sign-up without requiring an email field', () => {
    expect(() =>
      PasswordSignUpSchema.parse({
        username: 'Rover_123',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    ).not.toThrow();
  });
});
