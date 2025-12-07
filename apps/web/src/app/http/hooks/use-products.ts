import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getProducts } from '@/app/http/requests/products';

interface UseProductsOptions {
  search?: string;
  pageSize?: number;
  enabled?: boolean;
}

export function useProducts({ search, pageSize = 10, enabled = true }: UseProductsOptions = {}) {
  return useQuery({
    queryKey: ['products', { search, pageSize }],
    queryFn: () => getProducts({ page: 1, pageSize, search }),
    enabled,
  });
}

// Hook para invalidar cache de products após create/update/delete
export function useInvalidateProducts() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };
}
