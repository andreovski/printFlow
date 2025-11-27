'use client';

import { Budget, budgetStatusLabel } from '@magic-system/schemas';
import { Archive } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getArchivedBudgets } from '@/app/http/requests/budgets';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ArchivedBudgetsDialog() {
  const [open, setOpen] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchArchivedBudgets();
    }
  }, [open]);

  const fetchArchivedBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await getArchivedBudgets({ page: 1, pageSize: 100 });
      setBudgets(data);
    } catch (_error) {
      toast.error('Erro ao carregar orçamentos arquivados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" className="py-1" onClick={() => setOpen(true)}>
        <Archive className="h-4 w-4" />
      </Button>

      <ResponsiveDrawer
        open={open}
        onOpenChange={setOpen}
        title="Orçamentos Arquivados"
        description="Orçamentos que foram arquivados automaticamente ou manualmente"
        className="max-w-[600px] md:w-[80vw]"
        headerIcon={<Archive className="h-4 w-4" />}
      >
        <ScrollArea className="h-[400px] px-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Archive className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum orçamento arquivado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {budgets.map((budget) => (
                <div
                  key={budget.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">Orçamento #{budget.code}</p>
                    <p className="text-sm text-muted-foreground">{budget.client.name}</p>
                    {budget.total ? (
                      <p className="text-sm text-muted-foreground">
                        Total: R$ {Number(budget.total).toFixed(2)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                      {budgetStatusLabel[budget.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </ResponsiveDrawer>
    </>
  );
}
