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
    <header className="bg-background sticky top-0 z-20 flex h-14 items-center justify-between border-b px-4">
      <h1 className="text-lg font-semibold">Wuthering Waves Rotation Builder</h1>
      <div className="flex items-center">
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/admin/entities" className={navigationMenuTriggerStyle()}>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Configure entities
                  </div>
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/builds" className={navigationMenuTriggerStyle()}>
                  <div className="flex items-center gap-2">
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
