import { Calculator, Database, Library } from 'lucide-react';

export const APP_HEADER_HOME = {
  label: 'I.R.I.S. Rotation Inspector',
  to: '/',
} as const;

export const APP_HEADER_NAV_ITEMS = [
  {
    label: 'Entities',
    to: '/admin/entities',
    matchPath: '/admin',
    icon: Database,
  },
  {
    label: 'Builds',
    to: '/builds',
    matchPath: '/builds',
    icon: Library,
  },
  {
    label: 'Create',
    to: '/create',
    matchPath: '/create',
    icon: Calculator,
  },
] as const;

const APP_HEADER_ROUTE_ORDER = [
  APP_HEADER_HOME.to,
  ...APP_HEADER_NAV_ITEMS.map((item) => item.matchPath),
];

export const getAppHeaderRouteOrder = (pathname: string) => {
  const index = APP_HEADER_ROUTE_ORDER.findIndex((routePath) =>
    routePath === '/'
      ? pathname === routePath
      : pathname === routePath || pathname.startsWith(`${routePath}/`),
  );

  return index === -1 ? 0 : index;
};
