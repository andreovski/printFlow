import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { globalSearch } from '../requests/search';

interface UseGlobalSearchParams {
  query: string;
  types?: ('budgets' | 'cards')[];
  limit?: number;
  enabled?: boolean;
}

export function useGlobalSearch({
  query,
  types = ['budgets', 'cards'],
  limit = 25,
  enabled = true,
}: UseGlobalSearchParams) {
  // Debounce the search query by 300ms
  const debouncedQuery = useDebouncedValue(query, 300);

  const shouldFetch = enabled && debouncedQuery.trim().length >= 3;

  console.log('[useGlobalSearch]', {
    query,
    debouncedQuery,
    shouldFetch,
    types,
    limit,
  });

  return useQuery({
    queryKey: ['global-search', debouncedQuery, types, limit],
    queryFn: async () => {
      console.log('[useGlobalSearch] Fetching:', { q: debouncedQuery, types, limit });
      const result = await globalSearch({
        q: debouncedQuery,
        types,
        limit,
      });
      console.log('[useGlobalSearch] Result:', result);
      return result;
    },
    enabled: shouldFetch,
    // Cache results for 5 minutes
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
