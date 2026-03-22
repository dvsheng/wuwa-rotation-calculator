import { UserButton } from '@daveyplate/better-auth-ui';
import { Link, useRouterState } from '@tanstack/react-router';
import { Menu, SunMoon } from 'lucide-react';
import { useState } from 'react';

import {
  APP_HEADER_HOME,
  APP_HEADER_NAV_ITEMS,
} from '@/components/app-header-navigation';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Text } from '@/components/ui/typography';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

import { Toggle } from './ui/toggle';

export const AppHeader = () => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleTheme } = useTheme();

  return (
    <header className="bg-background px-panel sticky top-0 z-20 flex h-14 items-center justify-between border-b">
      <Link to={APP_HEADER_HOME.to} className="min-w-0">
        <Text as="h1" variant="title" className="text-lg">
          <span className="md:hidden">{APP_HEADER_HOME.mobileLabel}</span>
          <span className="hidden md:inline">{APP_HEADER_HOME.label}</span>
        </Text>
      </Link>
      <div className="flex items-center">
        <NavigationMenu viewport={false} className="hidden md:flex">
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
        <UserButton variant="ghost" />
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle>{APP_HEADER_HOME.mobileLabel}</SheetTitle>
              <SheetDescription>Navigate the app.</SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col p-2">
              {APP_HEADER_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.matchPath ||
                  pathname.startsWith(`${item.matchPath}/`);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
