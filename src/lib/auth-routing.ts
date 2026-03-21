export const AUTH_FALLBACK_REDIRECT = '/';

export type AuthView = 'callback' | 'complete-profile' | 'sign-in' | 'sign-up';

export function normalizeRedirectTo(redirectTo?: string) {
  if (!redirectTo || !redirectTo.startsWith('/')) {
    return AUTH_FALLBACK_REDIRECT;
  }

  if (redirectTo.startsWith('/auth/')) {
    return AUTH_FALLBACK_REDIRECT;
  }

  return redirectTo;
}

function buildAuthViewPath(view: AuthView, redirectTo?: string) {
  const normalizedRedirectTo = normalizeRedirectTo(redirectTo);
  const search = new URLSearchParams({ redirectTo: normalizedRedirectTo });

  return `/auth/${view}?${search.toString()}`;
}

export function buildAbsoluteAuthViewUrl(view: AuthView, redirectTo?: string) {
  if (import.meta.env.SSR) {
    return buildAuthViewPath(view, redirectTo);
  }

  return new URL(
    buildAuthViewPath(view, redirectTo),
    globalThis.location.origin,
  ).toString();
}
