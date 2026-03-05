import { Link, useRouterState } from '@tanstack/react-router';
import { Calculator, Database, Library } from 'lucide-react';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

export const AppHeader = () => {
  useRouterState({ select: (state) => state.location.pathname });
  return (
    <header className="bg-background px-panel sticky top-0 z-20 flex h-14 items-center justify-between border-b">
      <h1 className="text-lg font-semibold">Wuthering Waves Rotation Builder</h1>
      <div className="flex items-center">
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/admin/entities" className={navigationMenuTriggerStyle()}>
                  <div className="gap-compact flex items-center">
                    <Database className="h-4 w-4" />
                    Configure entities
                  </div>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/builds" className={navigationMenuTriggerStyle()}>
                  <div className="gap-compact flex items-center">
                    <Library className="h-4 w-4" />
                    Explore builds
                  </div>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/" className={navigationMenuTriggerStyle()}>
                  <Calculator size={16} />
                  Build Rotation
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
};
