import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import type { NavRouteItem } from '@/types/navigation';

export interface AppLayoutProps {
  routes: NavRouteItem[];
  brand?: string;
  headerActions?: ReactNode;
}

/** Full app shell: sidebar + header + routed content area. */
export function AppLayout({ routes, brand, headerActions }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar routes={routes} brand={brand} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
          <span className="text-sm font-semibold">Tiled Web Client</span>
          <div className="flex items-center gap-2">{headerActions}</div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
