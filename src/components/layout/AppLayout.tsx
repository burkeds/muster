import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { NavRouteItem } from "@/types/navigation";

export interface AppLayoutProps {
  routes: NavRouteItem[];
  brand?: string;
  headerActions?: ReactNode;
}

/** Full app shell: sidebar + header + routed content area. */
export function AppLayout({ routes, brand, headerActions }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <Sidebar routes={routes} brand={brand} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
          <span className="text-sm font-semibold">Muster</span>
          <div className="flex items-center gap-2">
            {headerActions}
            <ThemeToggle />
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto p-4 focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
