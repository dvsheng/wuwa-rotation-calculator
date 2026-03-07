import { getCurrentUser, signInWithRedirect, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

interface AuthUser {
  username: string;
  signInDetails?: { loginId?: string };
}

export function LoginButton() {
  const [user, setUser] = useState<AuthUser | undefined>();

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(undefined));

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        getCurrentUser()
          .then(setUser)
          .catch(() => setUser(undefined));
      } else if (payload.event === 'signedOut') {
        setUser(undefined);
      }
    });

    return unsubscribe;
  }, []);

  if (user) {
    return (
      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signInWithRedirect({ provider: 'Google' })}
    >
      <LogIn className="h-4 w-4" />
      Sign in with Google
    </Button>
  );
}
