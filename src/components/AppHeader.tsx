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

export const AppHeader = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  void pathname;

  return (
    <header className="bg-background sticky top-0 z-20 border-b px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Wuthering Waves Rotation Builder</h1>

        <div className="flex items-center">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Explore</NavigationMenuTrigger>
                <NavigationMenuContent className="right-0 left-auto -mt-1">
                  <ul>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link to="/builds" className={navigationMenuTriggerStyle()}>
                          <div className="flex items-center gap-2">
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
                          className={navigationMenuTriggerStyle()}
                        >
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Configure entities
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/" className={navigationMenuTriggerStyle()}>
                    <Calculator size={16} />
                    Build
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  );
};
