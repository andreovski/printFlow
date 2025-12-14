'use client';

import { Card as ApiCard } from '@magic-system/schemas';
import { Loader2 } from 'lucide-react';

import { useArchivedCards } from '@/app/http/hooks/use-boards';
import { ResponsiveDrawer } from '@/components/responsive-drawer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ProductionKanbanCard } from './kanban-card';

interface ArchivedCardsDialogProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardUpdated: (card: ApiCard) => void;
  onCardDeleted: (cardId: string) => void;
}

export function ArchivedCardsDialog({
  boardId,
  open,
  onOpenChange,
  onCardUpdated,
  onCardDeleted,
}: ArchivedCardsDialogProps) {
  const { data: archivedCards, isLoading } = useArchivedCards(boardId, open);

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Cards Arquivados"
      description="Visualize e gerencie os cards arquivados deste quadro."
      className="max-w-[600px]"
    >
      <ScrollArea className="h-[70vh] px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : archivedCards && archivedCards.length > 0 ? (
          <div className="space-y-3 pb-4">
            {archivedCards.map((card) => (
              <div key={card.id} className="bg-card">
                <ProductionKanbanCard
                  item={{
                    ...card,
                    name: card.title,
                    column: card.columnId,
                  }}
                  isArchivedMode
                  onCardUpdated={onCardUpdated}
                  onCardDeleted={onCardDeleted}
                />
              </div>
            ))}
          </div>
        ) : (
          <Alert className="mt-4">
            <AlertDescription>Nenhum card arquivado encontrado neste quadro.</AlertDescription>
          </Alert>
        )}
      </ScrollArea>
    </ResponsiveDrawer>
  );
}
