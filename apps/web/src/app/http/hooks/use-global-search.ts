import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { globalSearch } from '../requests/search';

interface UseGlobalSearchParams {
  query: string;
  types?: ('budgets' | 'cards' | 'clients' | 'products')[];
  limit?: number;
  enabled?: boolean;
}

export function useGlobalSearch({
  query,
  types = ['budgets', 'cards', 'clients', 'products'],
  limit = 25,
  enabled = true,
}: UseGlobalSearchParams) {
  // Debounce the search query by 300ms
  const debouncedQuery = useDebouncedValue(query, 300);

  const shouldFetch = enabled && debouncedQuery.trim().length >= 3;

  return useQuery({
    queryKey: ['global-search', debouncedQuery, types, limit],
    queryFn: async () => {
      const result = await globalSearch({
        q: debouncedQuery,
        types,
        limit,
      });
      return result;
    },
    enabled: shouldFetch,
    // Cache results for 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
