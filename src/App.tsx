import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Compass, Search as SearchIcon, LogIn, LogOut } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ServerSelector } from '@/components/layout/ServerSelector';
import { BrowsePage } from '@/features/browser/BrowsePage';
import { NodeDetailPage } from '@/features/node/NodeDetailPage';
import { SearchPage } from '@/features/search/SearchPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { WelcomeScreen } from '@/features/connect/WelcomeScreen';
import { useAuth } from '@/auth/auth-provider';
import { useServers } from '@/config/ServerProvider';
import { Button } from '@/components/ui/button';
import type { NavRouteItem } from '@/types/navigation';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

const navRoutes: NavRouteItem[] = [
  {
    path: '/browse',
    label: 'Browse',
    icon: <Compass className="h-4 w-4" />,
    element: <BrowsePage />,
  },
  {
    path: '/search',
    label: 'Search',
    icon: <SearchIcon className="h-4 w-4" />,
    element: <SearchPage />,
  },
];

/** Redirect to the connect screen when no Tiled server is selected. */
function RequireServer({ children }: { children: ReactNode }) {
  const { activeServer } = useServers();
  return activeServer ? <>{children}</> : <Navigate to="/connect" replace />;
}

/** Home: show the connect screen if no server is chosen, else browse. */
function HomeGate() {
  const { activeServer } = useServers();
  return activeServer ? <Navigate to="/browse" replace /> : <WelcomeScreen />;
}

function AuthMenu() {
  const { isAuthenticated, identity, onLogout } = useAuth();
  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className="inline-flex h-8 items-center gap-1 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <LogIn className="h-4 w-4" />
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary">{identity?.id ?? 'User'}</Badge>
      <Button variant="ghost" size="sm" onClick={onLogout}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <AppLayout
            routes={navRoutes}
            headerActions={
              <>
                <ServerSelector />
                <AuthMenu />
              </>
            }
          />
        }
      >
        <Route index element={<HomeGate />} />
        <Route
          path="browse/*"
          element={
            <RequireServer>
              <BrowsePage />
            </RequireServer>
          }
        />
        <Route
          path="node/*"
          element={
            <RequireServer>
              <NodeDetailPage />
            </RequireServer>
          }
        />
        <Route
          path="search"
          element={
            <RequireServer>
              <SearchPage />
            </RequireServer>
          }
        />
      </Route>
      <Route path="/connect" element={<WelcomeScreen />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth-callback" element={<AuthCallbackPage />} />
    </Routes>
  );
}
