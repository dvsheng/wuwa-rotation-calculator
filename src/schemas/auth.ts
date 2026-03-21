import { z } from 'zod';

export const AUTH_USERNAME_PATTERN = /^[A-Za-z0-9_.]+$/;
export const AUTH_TEMP_EMAIL_DOMAIN = 'tempemail.com';

export const AuthUsernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(AUTH_USERNAME_PATTERN);

export const AuthPasswordSchema = z.string().min(8);

export const UsernameSignInSchema = z.object({
  username: AuthUsernameSchema,
  password: AuthPasswordSchema,
});

export const PasswordSignUpSchema = z
  .object({
    username: AuthUsernameSchema,
    password: AuthPasswordSchema,
    confirmPassword: AuthPasswordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export function buildTemporaryEmailFromUsername(username: string) {
  return `${AuthUsernameSchema.parse(username)}@${AUTH_TEMP_EMAIL_DOMAIN}`;
}

export const CompleteProfileSchema = z.object({
  username: AuthUsernameSchema,
});

export const PasswordSignUpRequestSchema = PasswordSignUpSchema.extend({
  callbackURL: z.string().optional(),
});

export const UsernameSignInRequestSchema = UsernameSignInSchema.extend({
  callbackURL: z.string().optional(),
});

export const CompleteProfileRequestSchema = CompleteProfileSchema.extend({
  callbackURL: z.string().optional(),
});
