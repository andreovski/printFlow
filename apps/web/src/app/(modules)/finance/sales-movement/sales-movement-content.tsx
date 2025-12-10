'use client';

import { SalesMovementBudget } from '@magic-system/schemas';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DollarSign, TrendingUp, Percent, ShoppingCart, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  useSalesMovement,
  useSalesMovementKPIs,
  useToggleExcludeFromSales,
} from '@/app/http/hooks/use-sales-movement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Formatação de moeda
function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Componente de KPI Card
interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
}

function KPICard({ title, value, icon, description, isLoading }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de Toggle na tabela
interface ContabilizarToggleProps {
  budget: SalesMovementBudget;
  onToggle: (id: string, value: boolean) => void;
  isPending: boolean;
}

function ContabilizarToggle({ budget, onToggle, isPending }: ContabilizarToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={!budget.excludedFromSales}
        onCheckedChange={(checked) => onToggle(budget.id, !checked)}
        disabled={isPending}
      />
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}

export function SalesMovementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado para controlar se o componente foi montado no cliente
  const [hasMounted, setHasMounted] = useState(false);

  // Estado dos filtros - inicializa undefined para evitar hydration mismatch
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Datas para query (só atualiza ao clicar em Filtrar)
  const [queryDates, setQueryDates] = useState({
    startDate: '',
    endDate: '',
  });

  // Inicializa as datas apenas no cliente para evitar hydration mismatch
  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const initialStartDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : firstDayOfMonth;
    const initialEndDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : lastDayOfMonth;

    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setQueryDates({
      startDate: initialStartDate.toISOString(),
      endDate: initialEndDate.toISOString(),
    });
    setHasMounted(true);
  }, [searchParams]);

  // Queries com TanStack Query
  const {
    data: salesData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
  } = useSalesMovement({
    startDate: queryDates.startDate,
    endDate: queryDates.endDate,
    page,
    pageSize: 20,
  });

  const { data: kpisData, isLoading: isLoadingKpis } = useSalesMovementKPIs({
    startDate: queryDates.startDate,
    endDate: queryDates.endDate,
  });

  const toggleMutation = useToggleExcludeFromSales();

  const budgets = salesData?.data || [];
  const meta = salesData?.meta || { page: 1, pageSize: 20, total: 0, totalPages: 0 };
  const kpis = kpisData?.kpis;

  // Handler para filtrar
  const handleFilter = () => {
    if (!startDate || !endDate) {
      toast.error('Selecione as datas de início e fim');
      return;
    }

    // Atualiza URL
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    router.push(`/finance/sales-movement?${params.toString()}`);

    // Atualiza datas da query
    setQueryDates({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    setPage(1);
  };

  // Handler para toggle de contabilização
  const handleToggle = (id: string, excludedFromSales: boolean) => {
    toggleMutation.mutate(
      { id, excludedFromSales },
      {
        onSuccess: () => {
          toast.success(
            excludedFromSales
              ? 'Orçamento removido da contabilização'
              : 'Orçamento adicionado à contabilização'
          );
        },
        onError: () => {
          toast.error('Erro ao atualizar contabilização');
        },
      }
    );
  };

  // Handler para paginação
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Definição das colunas
  const columns: ColumnDef<SalesMovementBudget>[] = [
    {
      accessorKey: 'code',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-sm">#{row.original.code}</span>,
    },
    {
      accessorKey: 'clientName',
      header: 'Cliente',
    },
    {
      accessorKey: 'approvedAt',
      header: 'Data Aprovação',
      cell: ({ row }) =>
        row.original.approvedAt
          ? format(new Date(row.original.approvedAt), 'dd/MM/yyyy', {
              locale: ptBR,
            })
          : '-',
    },
    {
      accessorKey: 'saleValue',
      header: 'Valor Venda',
      cell: ({ row }) => formatCurrency(row.original.saleValue),
    },
    {
      accessorKey: 'costValue',
      header: 'Valor Custo',
      cell: ({ row }) => formatCurrency(row.original.costValue),
    },
    {
      accessorKey: 'profit',
      header: 'Lucro',
      cell: ({ row }) => {
        const profit = row.original.profit;
        return (
          <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
            {formatCurrency(profit)}
          </span>
        );
      },
    },
    {
      id: 'contabilizar',
      header: 'Contabilizar',
      cell: ({ row }) => (
        <ContabilizarToggle
          budget={row.original}
          onToggle={handleToggle}
          isPending={toggleMutation.isPending}
        />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link href={`/finance/budgets/${row.original.id}`} target="_blank">
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data: budgets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
  });

  const isLoading = isLoadingList || isFetchingList;

  // Mostra loading enquanto não inicializou as datas no cliente
  if (!hasMounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-16">
      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Data Início</label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Selecione a data inicial"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Data Fim</label>
          <DatePicker value={endDate} onChange={setEndDate} placeholder="Selecione a data final" />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <Button onClick={handleFilter} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Filtrar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Faturamento Total"
          value={kpis ? formatCurrency(kpis.totalRevenue) : '-'}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="Soma dos valores de venda"
          isLoading={isLoadingKpis}
        />
        <KPICard
          title="Custo Total"
          value={kpis ? formatCurrency(kpis.totalCost) : '-'}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          description="Soma dos valores de custo"
          isLoading={isLoadingKpis}
        />
        <KPICard
          title="Lucro Bruto"
          value={kpis ? formatCurrency(kpis.grossProfit) : '-'}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="Faturamento - Custo"
          isLoading={isLoadingKpis}
        />
        <KPICard
          title="Margem"
          value={kpis ? `${kpis.profitMargin.toFixed(2)}%` : '-'}
          icon={<Percent className="h-4 w-4 text-muted-foreground" />}
          description="(Lucro / Faturamento) × 100"
          isLoading={isLoadingKpis}
        />
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    // Não navega se clicou no switch ou botão
                    if (
                      (e.target as HTMLElement).closest('button') ||
                      (e.target as HTMLElement).closest('[role="switch"]')
                    ) {
                      return;
                    }
                    router.push(`/finance/budgets/${row.original.id}`);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum orçamento aprovado encontrado no período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {budgets.length} de {meta.total} orçamentos
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {page} de {meta.totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= meta.totalPages || isLoading}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
