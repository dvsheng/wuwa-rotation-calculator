import {
  BookOpenText,
  Calculator,
  Database,
  FlaskConical,
  Library,
} from 'lucide-react';

export const APP_HEADER_HOME = {
  label: 'I.R.I.S. Rotation Inspector',
  mobileLabel: 'I.R.I.S.',
  to: '/',
} as const;

export const APP_HEADER_NAV_ITEMS = [
  {
    label: 'About',
    to: '/about',
    matchPath: '/about',
    icon: BookOpenText,
  },
  {
    label: 'Entities',
    to: '/entities',
    matchPath: '/entities',
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
  {
    label: 'Game Data',
    to: '/game-data',
    matchPath: '/game-data',
    icon: FlaskConical,
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
