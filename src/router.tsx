import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

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
    defaultPreloadStaleTime: 0,
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => {
        if (!fromLocation) return [];
        const order = ['/', '/builds', '/create', '/admin'];
        const indexOf = (pathname: string) => {
          const index = order.findIndex(
            (r) => pathname === r || pathname.startsWith(r + '/'),
          );
          return index === -1 ? 0 : index;
        };
        const fromIndex = indexOf(fromLocation.pathname);
        const toIndex = indexOf(toLocation.pathname);
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
