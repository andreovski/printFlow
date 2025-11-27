'use client';

import { Budget, BudgetStatus, budgetStatusLabel } from '@magic-system/schemas';
import { budgetStatusColors } from '@magic-system/schemas';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAppContext } from '@/app/hooks/useAppContext';
import { updateBudgetStatus } from '@/app/http/requests/budgets';
import { Button } from '@/components/ui/button';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
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
  total: number;
  createdAt: Date;
  expirationDate: Date | null;
}

interface KanbanProps {
  budgets: Budget[];
}

export const Kanban = ({ budgets }: KanbanProps) => {
  const router = useRouter();
  const { organization } = useAppContext();

  // Transform budgets to kanban data format
  const initialData: BudgetKanbanData[] = budgets.map((budget) => ({
    id: budget.id,
    name: `#${budget.code}`,
    column: budget.status as BudgetStatus,
    code: budget.code,
    clientName: budget.client.name,
    clientPhone: budget.client.phone,
    total: Number(budget.total),
    createdAt: new Date(budget.createdAt),
    expirationDate: budget.expirationDate ? new Date(budget.expirationDate) : null,
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
        total: Number(budget.total),
        createdAt: new Date(budget.createdAt),
        expirationDate: budget.expirationDate ? new Date(budget.expirationDate) : null,
      }))
    );
  }, [budgets]);

  let columns = Object.entries(budgetStatusColors).map(([id, color]) => ({
    id: id as BudgetStatus,
    name: budgetStatusLabel[id as BudgetStatus],
    color,
  }));

  const handleDataChange = async (newData: BudgetKanbanData[]) => {
    // Find which budget changed status
    const changedBudget = newData.find((newItem) => {
      const oldItem = kanbanData.find((old) => old.id === newItem.id);
      return oldItem && oldItem.column !== newItem.column;
    });

    if (changedBudget) {
      try {
        // Update budget status in the backend
        await updateBudgetStatus(changedBudget.id, changedBudget.column);
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
            <KanbanCards id={column.id}>
              {(budget: BudgetKanbanData) => (
                <KanbanCard
                  column={column.id}
                  id={budget.id}
                  key={budget.id}
                  name={budget.name}
                  onClick={() => router.push(`/finance/budgets/${budget.id}`)}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex gap-2 items-center">
                          <p className="m-0 font-bold text-sm">#{budget.code}</p>
                          <p className="text-xs">{formatPhone(budget.clientPhone ?? '')}</p>
                        </div>
                        <p className="m-0 text-xs text-muted-foreground truncate">
                          {budget.clientName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {organization?.budgetShowTotalInKanban && (
                        <p className="m-0 font-semibold text-sm text-green-600">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(budget.total)}
                        </p>
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
