import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServerProvider } from '@/config/ServerProvider';
import { AuthProvider } from '@/auth/auth-provider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { resolveEnvTiledConfig } from '@/config/runtimeConfig';
import App from '@/App';
import '../tailwind.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

const envConfig = resolveEnvTiledConfig();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ServerProvider envUrl={envConfig.apiUrl} envApiKey={envConfig.apiKey}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ServerProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
