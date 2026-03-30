import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { auth } from '@/lib/auth';

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

const getSession = async (): Promise<Session | null> => {
  const request = getRequest();
  return auth.api.getSession({ headers: request.headers });
};

const getRequiredSession = async (): Promise<Session> => {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
};

export const authRequiredMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await getRequiredSession();

    return next({
      context: {
        session,
      },
    });
  },
);

export const adminRequiredMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await getRequiredSession();
    if (session.user.role !== 'admin') {
      throw new Error('Forbidden');
    }
    return next({
      context: {
        session,
      },
    });
  },
);

export const authOptionalMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await getSession();
    return next({
      context: {
        session,
      },
    });
  },
);
