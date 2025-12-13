'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useUsers } from '@/app/http/hooks/use-users';
import { Button } from '@/components/ui/button';
import { DataTablePaginated } from '@/components/ui/data-table-paginated';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { columns } from './columns';

export function AccessesContent() {
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Resetar página quando busca mudar
  useEffect(() => {
    if (debouncedSearch !== searchInput) {
      setPage(1);
    }
  }, [debouncedSearch, searchInput]);

  // Query de users
  const {
    data: usersData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useUsers({
    page,
    pageSize: 10,
    search: debouncedSearch,
  });

  const users = usersData?.data || [];
  const meta = usersData?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 0 };

  // Handler para mudança de página
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Mostrar toast de erro
  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar acessos');
    }
  }, [error]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Acessos</h1>
        <Button asChild>
          <Link href="/register/accesses/create">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Acesso
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-muted-foreground">Erro ao carregar acessos</p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : (
        <DataTablePaginated
          columns={columns}
          data={users}
          meta={meta}
          isLoading={isLoading}
          isFetching={isFetching}
          searchKey="name"
          searchValue={searchInput}
          searchPlaceholder="Buscar por nome..."
          onSearchChange={setSearchInput}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
