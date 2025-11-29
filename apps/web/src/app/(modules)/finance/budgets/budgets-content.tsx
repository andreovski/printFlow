'use client';

import { Budget } from '@magic-system/schemas';
import { LayoutList, LayoutGrid } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useCookieStorage } from '@/hooks/use-cookie-storage';
import { useDisclosure } from '@/hooks/use-disclosure';

import { columns } from './columns';
import { Kanban } from './kanban';

interface BudgetsContentProps {
  budgets: Budget[];
}

export function BudgetsContent({ budgets }: BudgetsContentProps) {
  const { value: viewValue, setValue: setViewValue } = useCookieStorage('budgets-view');

  const kanbanView = useDisclosure({
    opened: viewValue === 'kanban',
    onOpen: () => setViewValue('kanban'),
    onClose: () => setViewValue('list'),
  });

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={kanbanView.isOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => kanbanView.toggle()}
        >
          <LayoutList className="h-4 w-4 mr-2" />
          Lista
        </Button>
        <Button
          variant={!kanbanView.isOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => kanbanView.toggle()}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Quadro
        </Button>
      </div>

      {kanbanView.isOpen ? (
        <DataTable
          columns={columns}
          data={budgets || []}
          searchKey="client.name"
          searchPlaceholder="Buscar por cliente..."
        />
      ) : (
        <Kanban budgets={budgets || []} />
      )}
    </>
  );
}
