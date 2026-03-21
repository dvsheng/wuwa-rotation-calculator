import { LogIn, LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface LoginButtonProperties {
  compactOnMobile?: boolean;
}

export function LoginButton({ compactOnMobile = false }: LoginButtonProperties = {}) {
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
  const label = session ? 'Sign out' : 'Sign in with Google';
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label={compactOnMobile ? label : undefined}
      className={cn(compactOnMobile && 'max-md:px-2.5')}
    >
      <Icon />
      <span className={cn(compactOnMobile && 'max-md:sr-only')}>{label}</span>
    </Button>
  );
}
