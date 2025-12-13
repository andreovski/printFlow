'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTags } from '@/app/http/hooks/use-tags';
import { Button } from '@/components/ui/button';
import { DataTablePaginated } from '@/components/ui/data-table-paginated';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { columns } from './columns';

export function TagsContent() {
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Resetar página quando busca mudar
  useEffect(() => {
    if (debouncedSearch !== searchInput) {
      setPage(1);
    }
  }, [debouncedSearch, searchInput]);

  // Query de tags
  const {
    data: tagsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTags({
    page,
    pageSize: 10,
    search: debouncedSearch,
  });

  const tags = tagsData?.data || [];
  const meta = tagsData?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 0 };

  // Handler para mudança de página
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Mostrar toast de erro
  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar etiquetas');
    }
  }, [error]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold">Etiquetas</h1>
          <p className="text-muted-foreground">
            Gerencie as etiquetas para classificar orçamentos e cards de produção
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/tags/create">
            <Plus className="mr-2 h-4 w-4" />
            Criar Etiqueta
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-muted-foreground">Erro ao carregar etiquetas</p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : (
        <DataTablePaginated
          columns={columns}
          data={tags}
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
