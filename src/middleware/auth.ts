import { createMiddleware } from '@tanstack/react-start';
import { fetchAuthSession } from 'aws-amplify/auth';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Singleton verifier — created once per Lambda cold start and caches JWKS in memory.
// Note: the Lambda must be able to reach the Cognito JWKS endpoint on the internet for
// the first invocation. Add a NAT Gateway or move the Lambda to a subnet with internet
// access if this is a problem in production.
const createVerifier = () => {
  return CognitoJwtVerifier.create({
    userPoolId: process.env['COGNITO_USER_POOL_ID']!,
    tokenUse: 'access',
    clientId: process.env['COGNITO_USER_POOL_CLIENT_ID']!,
  });
};

type Verifier = Awaited<ReturnType<typeof createVerifier>>;
let verifier: Verifier | undefined;

const getVerifier = (): Verifier => {
  verifier ??= createVerifier();
  return verifier;
};

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

    const _verifier = getVerifier();
    let payload: Awaited<ReturnType<typeof _verifier.verify>>;
    try {
      payload = await _verifier.verify(authToken);
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
