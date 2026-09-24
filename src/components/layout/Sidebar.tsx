import { NavLink } from 'react-router-dom';
import { Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavRouteItem } from '@/types/navigation';

export interface SidebarProps {
  routes: NavRouteItem[];
  brand?: string;
}

/** Left navigation rail for the app shell. */
export function Sidebar({ routes, brand = 'Tiled Client' }: SidebarProps) {
  return (
    <aside className="flex h-full w-56 flex-col border-r bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Server className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">{brand}</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {routes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground',
              )
            }
          >
            {route.icon}
            <span>{route.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
