import { LogIn, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export function LoginButton() {
  const { data: session } = authClient.useSession();

  if (session) {
    return (
      <Button variant="ghost" size="sm" onClick={() => authClient.signOut()}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => authClient.signIn.social({ provider: 'google' })}
    >
      <LogIn className="h-4 w-4" />
      Sign in with Google
    </Button>
  );
}
