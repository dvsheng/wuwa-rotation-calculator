import { Amplify } from 'aws-amplify';

const redirectUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:3000/';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? '',
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID ?? '',
      loginWith: {
        oauth: {
          // Strip https:// if present — Amplify wants just the domain name
          domain: (import.meta.env.VITE_COGNITO_DOMAIN ?? '').replace(
            /^https?:\/\//,
            '',
          ),
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [redirectUrl],
          redirectSignOut: [redirectUrl],
          responseType: 'code',
        },
      },
    },
  },
});
