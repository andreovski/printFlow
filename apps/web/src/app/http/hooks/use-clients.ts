import type { CreateClientBody, UpdateClientBody } from '@magic-system/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createClient,
  deleteClient,
  getClient,
  getClients,
  updateClient,
} from '@/app/http/requests/clients';

export function useClients({
  page = 1,
  pageSize = 10,
  search,
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: ['clients', { page, pageSize, search }],
    queryFn: () => getClients({ page, pageSize, search }),
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

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientBody) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateClientBody) =>
      updateClient({ id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
    },
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
