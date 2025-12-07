import { TagScope } from '@magic-system/schemas';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getTags } from '@/app/http/requests/tags';

interface UseTagsOptions {
  scope?: TagScope;
  search?: string;
  active?: boolean;
  enabled?: boolean;
}

export function useTags({ scope, search, active = true, enabled = true }: UseTagsOptions = {}) {
  return useQuery({
    queryKey: ['tags', { scope, search, active }],
    queryFn: () => getTags({ page: 1, pageSize: 50, scope, search, active }),
    enabled,
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

// Hook para invalidar cache de tags após create/update/delete
export function useInvalidateTags() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };
}
