import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getSalesMovement,
  getSalesMovementKPIs,
  toggleExcludeFromSales,
} from '@/app/http/requests/sales-movement';

interface UseSalesMovementOptions {
  startDate: string;
  endDate: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useSalesMovement({
  startDate,
  endDate,
  page = 1,
  pageSize = 20,
  enabled = true,
}: UseSalesMovementOptions) {
  return useQuery({
    queryKey: ['sales-movement', { startDate, endDate, page, pageSize }],
    queryFn: () => getSalesMovement({ startDate, endDate, page, pageSize }),
    enabled: enabled && !!startDate && !!endDate,
  });
}

export function useSalesMovementKPIs({
  startDate,
  endDate,
  enabled = true,
}: Omit<UseSalesMovementOptions, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['sales-movement-kpis', { startDate, endDate }],
    queryFn: () => getSalesMovementKPIs({ startDate, endDate }),
    enabled: enabled && !!startDate && !!endDate,
  });
}

export function useToggleExcludeFromSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, excludedFromSales }: { id: string; excludedFromSales: boolean }) =>
      toggleExcludeFromSales(id, excludedFromSales),
    onSuccess: () => {
      // Invalida os KPIs para recalcular
      queryClient.invalidateQueries({ queryKey: ['sales-movement-kpis'] });
      // Invalida a lista para atualizar o estado do toggle
      queryClient.invalidateQueries({ queryKey: ['sales-movement'] });
    },
  });
}

export function useInvalidateSalesMovement() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['sales-movement'] });
  };
}
