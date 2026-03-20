import { LogIn, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export function LoginButton() {
  const { data: session } = authClient.useSession();

  const handleClick = () => {
    if (session) {
      authClient.signOut();
    } else {
      authClient.signIn.social({
        provider: 'google',
        callbackURL: globalThis.location.href,
      });
    }
  };

  const Icon = session ? LogOut : LogIn;
  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      <Icon />
      {session ? 'Sign out' : 'Sign in with Google'}
    </Button>
  );
}
