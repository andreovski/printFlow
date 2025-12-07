import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getClients, getClient } from '@/app/http/requests/clients';

interface UseClientsOptions {
  search?: string;
  pageSize?: number;
  enabled?: boolean;
}

export function useClients({ search, pageSize = 10, enabled = true }: UseClientsOptions = {}) {
  return useQuery({
    queryKey: ['clients', { search, pageSize }],
    queryFn: () => getClients({ page: 1, pageSize, search }),
    enabled,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id!),
    enabled: !!id,
  });
}

// Hook para invalidar cache de clients após create/update/delete
export function useInvalidateClients() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    queryClient.invalidateQueries({ queryKey: ['client'] });
  };
}
