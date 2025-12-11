'use client';

import { Budget, BudgetStatus, budgetStatusLabel, Tag } from '@magic-system/schemas';
import { budgetStatusColors } from '@magic-system/schemas';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useInvalidateSalesMovement } from '@/app/http/hooks/use-sales-movement';
import { updateBudgetStatus } from '@/app/http/requests/budgets';
import { Button } from '@/components/ui/button';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAppContext } from '@/hooks/use-app-context';
import { formatPhone } from '@/lib/masks';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

interface BudgetKanbanData extends Record<string, unknown> {
  id: string;
  name: string;
  column: BudgetStatus;
  code: number;
  clientName: string;
  clientPhone?: string;
  tags: Tag[];
  subtotal: number;
  total: number;
  createdAt: Date;
  expirationDate: Date | null;
  approvedByClient: boolean;
}

interface KanbanProps {
  budgets: Budget[];
}

export const Kanban = ({ budgets }: KanbanProps) => {
  const router = useRouter();
  const { organization } = useAppContext();
  const invalidateSalesMovement = useInvalidateSalesMovement();

  // Transform budgets to kanban data format
  const initialData: BudgetKanbanData[] = budgets.map((budget) => ({
    id: budget.id,
    name: `#${budget.code}`,
    column: budget.status as BudgetStatus,
    code: budget.code,
    clientName: budget.client.name,
    clientPhone: budget.client.phone,
    tags: budget.tags || [],
    subtotal: Number(budget.subtotal),
    total: Number(budget.total),
    createdAt: new Date(budget.createdAt),
    expirationDate: budget.expirationDate ? new Date(budget.expirationDate) : null,
    approvedByClient: budget.approvedByClient ?? false,
  }));

  const [kanbanData, setKanbanData] = useState<BudgetKanbanData[]>(initialData);
  const [columnsCollapsed, setColumnsCollapsed] = useState<BudgetStatus[]>([]);

  useEffect(() => {
    setKanbanData(
      budgets.map((budget) => ({
        id: budget.id,
        name: `#${budget.code}`,
        column: budget.status as BudgetStatus,
        code: budget.code,
        clientName: budget.client.name,
        clientPhone: budget.client.phone,
        tags: budget.tags || [],
        subtotal: Number(budget.subtotal),
        total: Number(budget.total),
        createdAt: new Date(budget.createdAt),
        expirationDate: budget.expirationDate ? new Date(budget.expirationDate) : null,
        approvedByClient: budget.approvedByClient ?? false,
      }))
    );
  }, [budgets]);

  let columns = Object.entries(budgetStatusColors).map(([id, color]) => ({
    id: id as BudgetStatus,
    name: budgetStatusLabel[id as BudgetStatus],
    color,
  }));

  const handleDataChange = async (newData: BudgetKanbanData[]) => {
    const isApprovedToOtherStatus = newData.find((newItem) => {
      const oldItem = kanbanData.find((old) => old.id === newItem.id);
      return oldItem && oldItem.column === 'ACCEPTED' && newItem.column !== 'ACCEPTED';
    });

    // Find which budget changed status
    const changedBudget = newData.find((newItem) => {
      const oldItem = kanbanData.find((old) => old.id === newItem.id);
      return oldItem && oldItem.column !== newItem.column;
    });

    if (changedBudget) {
      try {
        await updateBudgetStatus(changedBudget.id, changedBudget.column);

        if (changedBudget.column === 'ACCEPTED' || isApprovedToOtherStatus) {
          invalidateSalesMovement();
        }
        toast.success('Status do orçamento atualizado com sucesso');
        setKanbanData(newData);
        router.refresh();
      } catch (error) {
        toast.error('Erro ao atualizar status do orçamento');
        console.error(error);
      }
    } else {
      setKanbanData(newData);
    }
  };

  const toggleViewColumn = (columnId: BudgetStatus) => {
    setColumnsCollapsed((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  };

  return (
    <KanbanProvider columns={columns} data={kanbanData} onDataChange={handleDataChange}>
      {(column) => (
        <KanbanBoard
          id={column.id}
          key={column.id}
          className={columnsCollapsed.includes(column.id) ? 'h-[10px] min-h-[40px]' : ''}
        >
          <KanbanHeader>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color }} />
              <span className="font-semibold">{column.name}</span>
              <span className="text-xs text-muted-foreground">
                ({kanbanData.filter((b) => b.column === column.id).length})
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-4 w-4"
                onClick={() => toggleViewColumn(column.id)}
              >
                {columnsCollapsed.includes(column.id) ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </KanbanHeader>
          {!columnsCollapsed.includes(column.id) ? (
            <KanbanCards id={column.id} className="w-full">
              {(budget: BudgetKanbanData) => (
                <KanbanCard
                  column={column.id}
                  id={budget.id}
                  key={budget.id}
                  name={budget.name}
                  onClick={() => router.push(`/finance/budgets/${budget.id}`)}
                  className="cursor-pointer hover:shadow-md transition-shadow w-full max-w-full"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex gap-2 items-center">
                          <p className="m-0 font-bold text-sm">#{budget.code}</p>
                          <p className="text-xs">{formatPhone(budget.clientPhone ?? '')}</p>
                          {/* Client approval/rejection indicator */}
                          {budget.approvedByClient &&
                            (budget.column === 'ACCEPTED' || budget.column === 'REJECTED') && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className={`inline-flex items-center justify-center h-4 w-4 rounded-full ${
                                        budget.column === 'ACCEPTED'
                                          ? 'bg-green-100 dark:bg-green-900 text-green-600'
                                          : 'bg-red-100 dark:bg-red-900 text-red-600'
                                      }`}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {budget.column === 'ACCEPTED'
                                        ? 'Aprovado pelo cliente (via link)'
                                        : 'Recusado pelo cliente (via link)'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                        </div>
                        <p className="m-0 text-xs text-muted-foreground break-words">
                          {budget.clientName}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {budget.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 p-0.5 rounded-sm text-[0.5rem] font-medium text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      {organization?.budgetShowTotalInKanban && (
                        <div className="flex flex-col items-start">
                          <p className="m-0 text-[10px] text-muted-foreground/60 mr-1">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(budget.subtotal)}
                          </p>
                          <p className="m-0 font-semibold text-sm text-green-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(budget.total)}
                          </p>
                        </div>
                      )}
                      <p className="m-0 text-xs ml-auto">
                        {budget.expirationDate && dateFormatter.format(budget.expirationDate)}
                      </p>
                    </div>
                  </div>
                </KanbanCard>
              )}
            </KanbanCards>
          ) : null}
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
};
