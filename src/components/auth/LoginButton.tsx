import { Link, useLocation } from '@tanstack/react-router';
import { CircleUserRound, LogIn, LogOut, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient, useSession } from '@/lib/auth-client';
import { normalizeRedirectTo } from '@/lib/auth-routing';
import { cn } from '@/lib/utils';

interface LoginButtonProperties {
  compactOnMobile?: boolean;
}

export function LoginButton({ compactOnMobile = false }: LoginButtonProperties = {}) {
  const { data: session } = useSession();
  const currentLocation = useLocation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const redirectTo = normalizeRedirectTo(currentLocation.href);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await authClient.signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!session) {
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        aria-label={compactOnMobile ? 'Sign in' : undefined}
        className={cn(compactOnMobile && 'max-md:px-2.5')}
      >
        <Link
          to="/auth/$authView"
          params={{ authView: 'sign-in' }}
          search={{ redirectTo }}
        >
          <LogIn />
          <span className={cn(compactOnMobile && 'max-md:sr-only')}>Sign in</span>
        </Link>
      </Button>
    );
  }

  const username =
    (session.user.isAnonymous ? 'Guest' : undefined) ||
    session.user.username ||
    session.user.email;
  const needsUsername = !session.user.username;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={compactOnMobile ? 'Account menu' : undefined}
          className={cn(compactOnMobile && 'max-md:px-2.5')}
        >
          <CircleUserRound />
          <span className={cn(compactOnMobile && 'max-md:sr-only')}>{username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="max-w-64 truncate">
          {session.user.isAnonymous ? 'Guest account' : session.user.email}
        </DropdownMenuLabel>
        {needsUsername && !session.user.isAnonymous && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/auth/$authView"
                params={{ authView: 'complete-profile' }}
                search={{ redirectTo }}
              >
                <Sparkles />
                Configure Username
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isSigningOut} onSelect={() => void handleSignOut()}>
          <LogOut />
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
