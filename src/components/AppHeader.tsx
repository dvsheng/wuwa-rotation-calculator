import { Link, useRouterState } from '@tanstack/react-router';
import { Calculator, Database, Library } from 'lucide-react';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';

export const AppHeader = () => {
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

        <div className="flex items-center">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/"
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isBuildRoute &&
                        'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                    )}
                  >
                    <Calculator size={16} />
                    Build
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    isExploreRoute &&
                      'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                  )}
                >
                  Explore
                </NavigationMenuTrigger>
                <NavigationMenuContent className="right-0 left-auto min-w-[220px]">
                  <ul className="grid gap-1">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/builds"
                          className="focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground block space-y-1 rounded-md p-2 leading-none transition-colors outline-none select-none"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Library className="h-4 w-4" />
                            Explore builds
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/admin/entities"
                          className="focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground block space-y-1 rounded-md p-2 leading-none transition-colors outline-none select-none"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Database className="h-4 w-4" />
                            Configure entities
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
};
