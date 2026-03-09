import { createMiddleware } from '@tanstack/react-start';
import { fetchAuthSession } from 'aws-amplify/auth';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Singleton verifier — created once per Lambda cold start and caches JWKS in memory.
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env['COGNITO_USER_POOL_ID']!,
  tokenUse: 'access',
  clientId: process.env['COGNITO_USER_POOL_CLIENT_ID']!,
});

// Pre-fetch JWKS during cold start so it's not on the critical path of the first request.
// If this fails (e.g. transient network error), verify() will retry automatically.
await verifier.hydrate().catch(() => {});

export interface AuthContext {
  user: { sub: string; username: string };
}

export const authMiddleware = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    let token: string | undefined;
    try {
      const session = await fetchAuthSession();
      token = session.tokens?.accessToken.toString();
    } catch {
      // not authenticated
    }
    return next({ sendContext: { authToken: token } });
  })
  .server(async ({ next, context }) => {
    const { authToken } = context as { authToken?: string };

    if (!authToken) {
      throw new Error('Unauthorized');
    }

    let payload: Awaited<ReturnType<typeof verifier.verify>>;
    try {
      payload = await verifier.verify(authToken);
    } catch {
      throw new Error('Unauthorized');
    }

    return next({
      context: {
        user: {
          sub: payload.sub,
          username: (payload['cognito:username'] as string | undefined) ?? payload.sub,
        },
      },
    });
  });
