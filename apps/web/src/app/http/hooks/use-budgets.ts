import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  archiveBudget,
  createBudget,
  deleteBudget,
  getBudget,
  getBudgets,
  getBudgetsForKanban,
  updateBudget,
} from '../requests/budgets';

interface UseBudgetsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  enabled?: boolean;
}

export function useBudgets({
  page = 1,
  pageSize = 10,
  search,
  enabled = true,
}: UseBudgetsParams = {}) {
  return useQuery({
    queryKey: ['budgets', { page, pageSize, search }],
    queryFn: () => getBudgets({ page, pageSize, search }),
    enabled,
  });
}

export function useBudgetsKanban(enabled = true) {
  return useQuery({
    queryKey: ['budgets', 'kanban'],
    queryFn: () => getBudgetsForKanban(),
    enabled,
  });
}

export function useBudget(id: string, enabled = true) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: () => getBudget(id),
    enabled,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & any) => updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useArchiveBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDuplicateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        status: 'DRAFT',
        items: data.items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          width: i.width || null,
          height: i.height || null,
          discountType: i.discountType || null,
          discountValue: i.discountValue || null,
        })),
      };
      return createBudget(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
