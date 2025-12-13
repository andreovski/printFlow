import { TagScope } from '@magic-system/schemas';
import type { CreateTagBody, UpdateTagBody } from '@magic-system/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createTag, deleteTag, getTag, getTags, updateTag } from '@/app/http/requests/tags';

export function useTags({
  page = 1,
  pageSize = 10,
  search,
  scope,
  active,
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  scope?: TagScope;
  active?: boolean;
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: ['tags', { page, pageSize, search, scope, active }],
    queryFn: () => getTags({ page, pageSize, search, scope, active }),
    enabled,
  });
}

export function useTag(id: string | undefined) {
  return useQuery({
    queryKey: ['tag', id],
    queryFn: () => getTag(id!),
    enabled: !!id,
  });
}

// Hook para buscar tags de um scope + globais combinadas
export function useTagsWithGlobal(scope: TagScope, search?: string) {
  const scopedQuery = useTags({ scope, search, enabled: scope !== 'GLOBAL' });
  const globalQuery = useTags({ scope: 'GLOBAL', search, enabled: scope !== 'GLOBAL' });
  const singleQuery = useTags({ scope, search, enabled: scope === 'GLOBAL' });

  if (scope === 'GLOBAL') {
    return {
      data: singleQuery.data?.data || [],
      isLoading: singleQuery.isLoading,
      error: singleQuery.error,
    };
  }

  // Combinar dados de ambos os escopos
  const isLoading = scopedQuery.isLoading || globalQuery.isLoading;
  const error = scopedQuery.error || globalQuery.error;
  const allData = [...(scopedQuery.data?.data || []), ...(globalQuery.data?.data || [])];

  // Remover duplicatas
  const uniqueTags = allData.filter(
    (tag, index, self) => index === self.findIndex((t) => t.id === tag.id)
  );

  return { data: uniqueTags, isLoading, error };
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagBody) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateTagBody) => updateTag({ id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag'] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag'] });
    },
  });
}

// Hook para invalidar cache de tags após create/update/delete
export function useInvalidateTags() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };
}
