import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { anonymous, username } from 'better-auth/plugins';
import { tanstackStartCookies } from 'better-auth/tanstack-start/solid';
import { eq } from 'drizzle-orm';

import { database } from '@/db/client';
import {
  authAccount,
  authSession,
  authUser,
  authVerification,
  rotations,
} from '@/db/schema';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(database, {
    provider: 'pg',
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    username(),
    anonymous({
      disableDeleteAnonymousUser: true,
      async onLinkAccount({ anonymousUser, newUser }) {
        await database
          .update(rotations)
          .set({ ownerId: newUser.user.id, updatedAt: new Date() })
          .where(eq(rotations.ownerId, anonymousUser.user.id));
      },
    }),
    tanstackStartCookies(),
  ],
});
