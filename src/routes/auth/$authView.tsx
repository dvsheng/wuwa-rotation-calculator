import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { AuthPage } from '@/components/auth/AuthPage';
import type { AuthView } from '@/lib/auth-routing';

const authSearchSchema = z.object({
  redirectTo: z.string().optional(),
});

const AUTH_VIEWS = new Set<AuthView>([
  'callback',
  'complete-profile',
  'sign-in',
  'sign-up',
]);

function AuthRoutePage() {
  const { authView } = Route.useParams();
  const { redirectTo } = Route.useSearch();
  const view = AUTH_VIEWS.has(authView as AuthView) ? authView : 'sign-in';
  return <AuthPage view={view as AuthView} redirectTo={redirectTo} />;
}

export const Route = createFileRoute('/auth/$authView')({
  validateSearch: authSearchSchema,
  component: AuthRoutePage,
});
