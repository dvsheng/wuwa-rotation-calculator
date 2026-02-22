import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Calculator, ChevronDown, Database, Library } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AppHeader = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isBuildRoute = pathname === '/';
  const isExploreRoute = pathname === '/builds' || pathname.startsWith('/admin');

  return (
    <header className="from-card via-card to-muted/20 border-border sticky top-0 z-20 border-b bg-gradient-to-r px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="from-primary bg-gradient-to-r to-blue-600 bg-clip-text text-xl font-bold text-transparent">
            Wuthering Waves Rotation Builder
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant={isBuildRoute ? 'default' : 'secondary'} size="sm">
            <Link to="/">
              <Calculator size={16} />
              Build
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={isExploreRoute ? 'default' : 'secondary'}
                size="sm"
                aria-label="Open explore menu"
              >
                Explore
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void navigate({ to: '/builds' })}>
                <Library className="h-4 w-4" />
                Explore builds
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => void navigate({ to: '/admin/entities' })}
              >
                <Database className="h-4 w-4" />
                Configure entities
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
