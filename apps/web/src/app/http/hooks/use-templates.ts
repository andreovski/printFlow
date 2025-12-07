import { TemplateScope } from '@magic-system/schemas';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getTemplates } from '@/app/http/requests/templates';

interface UseTemplatesOptions {
  scope: TemplateScope;
  active?: boolean;
  enabled?: boolean;
}

export function useTemplates({ scope, active = true, enabled = true }: UseTemplatesOptions) {
  return useQuery({
    queryKey: ['templates', { scope, active }],
    queryFn: () => getTemplates({ page: 1, pageSize: 50, scope, active }),
    enabled,
  });
}

// Hook para buscar templates de um scope + globais combinadas
export function useTemplatesWithGlobal(scope: TemplateScope) {
  const scopedQuery = useTemplates({ scope, enabled: scope !== 'GLOBAL' });
  const globalQuery = useTemplates({ scope: 'GLOBAL', enabled: scope !== 'GLOBAL' });
  const singleQuery = useTemplates({ scope, enabled: scope === 'GLOBAL' });

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
  const uniqueTemplates = allData.filter(
    (template, index, self) => index === self.findIndex((t) => t.id === template.id)
  );

  return { data: uniqueTemplates, isLoading, error };
}

// Hook para invalidar cache de templates após create/update/delete
export function useInvalidateTemplates() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['templates'] });
  };
}
