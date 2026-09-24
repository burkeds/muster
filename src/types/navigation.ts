import type { ReactNode } from 'react';

export interface NavRouteItem {
  path: string;
  label: string;
  icon?: ReactNode;
  element: ReactNode;
}
