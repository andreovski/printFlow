'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados ficam "fresh" por 5 minutos - evita refetch desnecessário
            staleTime: 5 * 60 * 1000,
            // Cache mantido por 10 minutos após desuso
            gcTime: 10 * 60 * 1000,
            // Não refetch automático ao focar janela
            refetchOnWindowFocus: false,
            // Retry uma vez em caso de erro
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
