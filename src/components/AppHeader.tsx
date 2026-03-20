import { Link, useRouterState } from '@tanstack/react-router';
import { SunMoon } from 'lucide-react';

import {
  APP_HEADER_HOME,
  APP_HEADER_NAV_ITEMS,
} from '@/components/app-header-navigation';
import { LoginButton } from '@/components/auth/LoginButton';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Text } from '@/components/ui/typography';
import { useTheme } from '@/hooks/useTheme';

import { Toggle } from './ui/toggle';

export const AppHeader = () => {
  useRouterState({ select: (state) => state.location.pathname });
  const { toggleTheme } = useTheme();

  return (
    <header className="bg-background px-panel sticky top-0 z-20 flex h-14 items-center justify-between border-b">
      <Link to={APP_HEADER_HOME.to} className="min-w-0">
        <Text as="h1" variant="title" className="text-lg">
          {APP_HEADER_HOME.label}
        </Text>
      </Link>
      <div className="flex items-center">
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            {APP_HEADER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <NavigationMenuItem key={item.to}>
                  <NavigationMenuLink asChild>
                    <Link to={item.to} className={navigationMenuTriggerStyle()}>
                      <div className="gap-inset flex items-center">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>
        <Toggle onClick={toggleTheme} aria-label="Toggle dark mode">
          <SunMoon className="size-4" />
        </Toggle>
        <LoginButton />
      </div>
    </header>
  );
};
