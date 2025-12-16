import { GlobalSearchResult } from '@magic-system/schemas';

import { api } from '../api';

interface GlobalSearchParams {
  q: string;
  types?: ('budgets' | 'cards' | 'clients' | 'products')[];
  limit?: number;
}

export async function globalSearch(params: GlobalSearchParams): Promise<GlobalSearchResult> {
  const { q, types, limit } = params;

  const searchParams = new URLSearchParams({ q });

  if (types && types.length > 0) {
    types.forEach((type) => searchParams.append('types', type));
  }

  if (limit) {
    searchParams.append('limit', limit.toString());
  }

  const url = `search?${searchParams.toString()}`;
  console.log('[globalSearch] Calling API:', url);

  const response = await api.get(url);
  const data = await response.json<GlobalSearchResult>();

  console.log('[globalSearch] Response:', data);

  return data;
}
