import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import { getAppHeaderRouteOrder } from '@/components/app-header-navigation';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
    },
    scrollRestoration: true,
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => {
        if (!fromLocation) return [];
        const fromIndex = getAppHeaderRouteOrder(fromLocation.pathname);
        const toIndex = getAppHeaderRouteOrder(toLocation.pathname);
        if (fromIndex === toIndex) return [];
        return fromIndex > toIndex ? ['slide-right'] : ['slide-left'];
      },
    },
  });

  return router;
};

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
