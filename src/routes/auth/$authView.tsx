import { AuthView } from '@daveyplate/better-auth-ui';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/$authView')({
  component: RouteComponent,
});

function RouteComponent() {
  const { authView } = Route.useParams();
  const redirectTo = '/builds';

  return (
    <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
      <AuthView pathname={authView} redirectTo={redirectTo} />
    </main>
  );
}
