'use client';

import { Budget } from '@magic-system/schemas';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useCookieStorage } from '@/hooks/use-cookie-storage';

import { columns } from './columns';
import { Kanban } from './kanban';

interface BudgetsContentProps {
  budgets: Budget[];
}

export function BudgetsContent({ budgets }: BudgetsContentProps) {
  const { value: viewValue, setValue: setViewValue } = useCookieStorage('budgets-view');

  // Track if component has mounted to avoid hydration mismatch
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Default to 'kanban' view (Quadro) on SSR and before mount
  // After mount, use the stored value
  const isListView = hasMounted ? viewValue === 'list' : false;

  const toggleView = () => {
    setViewValue(isListView ? 'kanban' : 'list');
  };

  return (
    <>
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

      {isListView ? (
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
