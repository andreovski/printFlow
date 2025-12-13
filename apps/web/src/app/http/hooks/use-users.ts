import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteUser, getUser, getUsers } from '@/app/http/requests/users';

export function useUsers({
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
    queryKey: ['users', { page, pageSize, search }],
    queryFn: () => getUsers({ page, pageSize, search }),
    enabled,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => getUser(id!),
    enabled: !!id,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };
}
