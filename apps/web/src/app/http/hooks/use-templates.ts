import { TemplateScope } from '@magic-system/schemas';
import type { CreateTemplateBody, UpdateTemplateBody } from '@magic-system/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  getTemplates,
  updateTemplate,
} from '@/app/http/requests/templates';

export function useTemplates({
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
  scope?: TemplateScope;
  active?: boolean;
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: ['templates', { page, pageSize, search, scope, active }],
    queryFn: () => getTemplates({ page, pageSize, search, scope, active }),
    enabled,
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: () => getTemplate(id!),
    enabled: !!id,
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

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTemplateBody) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateTemplateBody) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['template'] });
    },
  });
}

// Hook para invalidar cache de templates após create/update/delete
export function useInvalidateTemplates() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['templates'] });
  };
}
