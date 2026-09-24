import { useQuery } from '@tanstack/react-query';
import { useOptionalTiledClient } from '@/config/useTiledClient';

/** React-query hook for GET / (server info + auth discovery). */
export function useServerInfo() {
  const client = useOptionalTiledClient();

  return useQuery({
    queryKey: ['tiled', 'about', client?.baseUrl],
    queryFn: () => client!.about(),
    enabled: !!client,
    staleTime: 5 * 60 * 1000,
  });
}
