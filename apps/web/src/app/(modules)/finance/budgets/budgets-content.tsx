'use client';

import { FilePlus, LayoutGrid, LayoutList } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useBudgets, useBudgetsKanban } from '@/app/http/hooks/use-budgets';
import { getOrganization } from '@/app/http/requests/organization';
import { Button } from '@/components/ui/button';
import { DataTablePaginated } from '@/components/ui/data-table-paginated';
import { useCookieStorage } from '@/hooks/use-cookie-storage';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

import { ArchivedBudgetsDialog } from './_components/archived-budgets-dialog';
import { BudgetSettingsDialog } from './_components/budget-settings-dialog';
import { columns } from './columns';
import { Kanban } from './kanban';

export function BudgetsContent() {
  const { value: viewValue, setValue: setViewValue } = useCookieStorage('budgets-view');
  const [hasMounted, setHasMounted] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [organization, setOrganization] = useState<any>(null);
  const [userRole, setUserRole] = useState('');

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Resetar página quando busca mudar
  useEffect(() => {
    if (debouncedSearch !== searchInput) {
      setPage(1);
    }
  }, [debouncedSearch, searchInput]);

  // Fetch organization and user role
  useEffect(() => {
    setHasMounted(true);

    getOrganization()
      .then((data) => setOrganization(data.organization))
      .catch(() => setOrganization(null));

    // Get user role from token (client-side)
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || '');
      } catch (_e) {
        // Ignore invalid token
      }
    }
  }, []);

  const isListView = hasMounted ? viewValue === 'list' : false;
  const isAdmin = userRole === 'ADMIN' || userRole === 'MASTER';

  const toggleView = () => {
    setViewValue(isListView ? 'kanban' : 'list');
  };

  // Query de budgets para listagem (paginada)
  const {
    data: budgetsData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    error: errorList,
    refetch: refetchList,
  } = useBudgets({
    page,
    pageSize: 10,
    search: debouncedSearch,
    enabled: isListView,
  });

  // Query de budgets para kanban (todos os dados)
  const {
    data: kanbanData,
    isLoading: isLoadingKanban,
    error: errorKanban,
    refetch: refetchKanban,
  } = useBudgetsKanban(!isListView);

  const budgets = budgetsData?.data || [];
  const kanbanBudgets = kanbanData?.budgets || [];
  const meta = budgetsData?.meta || { page: 1, pageSize: 10, total: 0, totalPages: 0 };

  const isLoading = isListView ? isLoadingList : isLoadingKanban;
  const isFetching = isListView ? isFetchingList : false;
  const error = isListView ? errorList : errorKanban;
  const refetch = isListView ? refetchList : refetchKanban;

  // Handler para mudança de página
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Mostrar toast de erro
  useEffect(() => {
    if (error) {
      toast.error('Erro ao carregar orçamentos');
    }
  }, [error]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Orçamentos</h1>
        <div className="flex items-center gap-2">
          <ArchivedBudgetsDialog />
          {isAdmin && <BudgetSettingsDialog organization={organization} />}
          <Button asChild>
            <Link href="/finance/budgets/create">
              <FilePlus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button variant={isListView ? 'default' : 'outline'} size="sm" onClick={toggleView}>
          <LayoutList className="h-4 w-4 mr-2" />
          Lista
        </Button>
        <Button variant={!isListView ? 'default' : 'outline'} size="sm" onClick={toggleView}>
          <LayoutGrid className="h-4 w-4 mr-2" />
          Quadro
        </Button>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-muted-foreground">Erro ao carregar orçamentos</p>
          <Button onClick={() => refetch()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : isListView ? (
        <DataTablePaginated
          columns={columns}
          data={budgets}
          meta={meta}
          isLoading={isLoading}
          isFetching={isFetching}
          searchKey="client.name"
          searchValue={searchInput}
          searchPlaceholder="Buscar por cliente..."
          onSearchChange={setSearchInput}
          onPageChange={handlePageChange}
        />
      ) : isLoadingKanban ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Carregando quadro...</p>
        </div>
      ) : (
        <Kanban budgets={kanbanBudgets} />
      )}
    </div>
  );
}
