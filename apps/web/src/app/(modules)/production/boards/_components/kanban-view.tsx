'use client';

import { Plus, Trash2, ArrowUpDown, GripVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Board,
  moveCard,
  Card as ApiCard,
  deleteColumn,
  moveColumn,
} from '@/app/http/requests/boards';
import { DialogAction } from '@/components/dialog-action';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  KanbanBoard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import { useDisclosure } from '@/hooks/use-disclosure';
import { cn } from '@/lib/utils';

import { CreateCardDialog } from '../create/create-card-dialog';
import { CreateColumnDialog } from './create-column-dialog';
import { ProductionKanbanCard } from './kanban-card';

interface KanbanViewProps {
  boards: Board[];
  selectedBoard: Board;
  onBoardChange: (boardId: string) => void;
}

export function KanbanView({ boards, selectedBoard, onBoardChange }: KanbanViewProps) {
  const router = useRouter();

  const [columns, setColumns] = useState(
    (selectedBoard.columns || [])
      .sort((a, b) => a.order - b.order)
      .map((col) => ({
        id: col.id,
        name: col.title,
        order: col.order,
      }))
  );
  const [cards, setCards] = useState(
    (selectedBoard.columns || []).flatMap((col) =>
      (col.cards || []).map((card) => ({
        ...card,
        name: card.title,
        column: col.id,
      }))
    )
  );
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);

  const dialogDelete = useDisclosure();

  // Update columns and cards when selectedBoard changes
  useEffect(() => {
    const newColumns = (selectedBoard.columns || [])
      .sort((a, b) => a.order - b.order)
      .map((col) => ({
        id: col.id,
        name: col.title,
        order: col.order,
      }));
    setColumns(newColumns);

    const newCards = (selectedBoard.columns || []).flatMap((col) =>
      (col.cards || []).map((card) => ({
        ...card,
        name: card.title,
        column: col.id,
      }))
    );
    setCards(newCards);
  }, [selectedBoard]);

  const onDragStart = (event: any) => {
    setActiveDragId(event.active.id);
  };

  const onDataChange = async (newData: typeof cards) => {
    const movedCard = newData.find((c) => c.id === activeDragId);
    if (!movedCard || !activeDragId) {
      setCards(newData);
      return;
    }

    const oldCard = cards.find((c) => c.id === activeDragId);

    // Update UI immediately
    setCards(newData);
    setActiveDragId(null);

    // Calculate new position
    const destinationColumnId = movedCard.column;
    const cardsInDestColumn = newData.filter((c) => c.column === destinationColumnId);
    const newPosition = cardsInDestColumn.findIndex((c) => c.id === activeDragId);

    if (
      oldCard &&
      (oldCard.column !== destinationColumnId ||
        cards.findIndex((c) => c.id === activeDragId) !==
          newData.findIndex((c) => c.id === activeDragId))
    ) {
      try {
        await moveCard(activeDragId, destinationColumnId, newPosition);
      } catch (error) {
        toast.error('Erro ao mover cartão');
        // Revert state if needed (complex without full history)
        console.error(error);
      }
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      toast.success('Coluna excluída com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir coluna. Verifique se ela não possui cartões.');
    }
  };

  const handleColumnsReorder = async (newColumns: typeof columns) => {
    const previousColumns = columns;
    setColumns(newColumns);

    try {
      await Promise.all(
        newColumns.map((col, index) => moveColumn(col.id, selectedBoard.id, index))
      );
      toast.success('Colunas reordenadas com sucesso');

      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao reordenar colunas');
      setColumns(previousColumns);
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex flex-col gap-8 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Quadros</h1>
        <div className="flex items-center gap-3 px-1">
          <Select value={selectedBoard.id} onValueChange={onBoardChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CreateColumnDialog
            boardId={selectedBoard.id}
            onColumnCreated={(newColumn) => {
              setColumns((prev) => [
                ...prev,
                { id: newColumn.id, name: newColumn.title, order: newColumn.order },
              ]);
              router.refresh();
            }}
          >
            <Button variant="outline" size="sm">
              <Plus className="md:mr-2 h-4 w-4" />
              <p className="hidden md:block">Nova Coluna</p>
            </Button>
          </CreateColumnDialog>
          <Button
            variant={isReorderMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsReorderMode(!isReorderMode)}
            className="transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowUpDown
              className={cn(
                'md:mr-2 h-4 w-4 transition-transform duration-500',
                isReorderMode && 'rotate-180'
              )}
            />
            <p className="hidden md:block">
              {isReorderMode ? 'Ordenar Cartões' : 'Ordenar Colunas'}
            </p>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-1">
        <KanbanProvider
          columns={columns}
          data={cards}
          onDataChange={onDataChange}
          onDragStart={onDragStart}
          onColumnsChange={handleColumnsReorder}
          isReorderMode={isReorderMode}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id} className="min-w-[220px] flex flex-col">
              <KanbanHeader className="flex items-center border-none">
                <div className="flex items-center gap-2 mr-auto">
                  <span>{column.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({cards.filter((c) => c.column === column.id).length})
                  </span>
                </div>

                <div
                  className={cn(
                    'flex items-center gap-1 animate-in slide-in-from-right-5 fade-in duration-300',
                    !isReorderMode && 'hidden'
                  )}
                >
                  <GripVertical className="h-6 w-6 text-muted-foreground cursor-grab active:cursor-grabbing animate-pulse" />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 animate-in slide-in-from-right-5 fade-in duration-300',
                    isReorderMode && 'hidden'
                  )}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => dialogDelete.open({ state: column.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CreateCardDialog
                    columnId={column.id}
                    onCardCreated={(newCard: ApiCard) => {
                      setCards((prev) => [
                        ...prev,
                        { ...newCard, name: newCard.title, column: column.id },
                      ]);
                      router.refresh();
                    }}
                  >
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CreateCardDialog>
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(item) => (
                  <ProductionKanbanCard
                    item={item as unknown as ApiCard & { name: string; column: string }}
                    onCardUpdated={(updatedCard: ApiCard) => {
                      setCards((prev) =>
                        prev.map((c) =>
                          c.id === updatedCard.id
                            ? { ...updatedCard, name: updatedCard.title, column: item.column }
                            : c
                        )
                      );
                      router.refresh();
                    }}
                    onCardDeleted={(cardId: string) => {
                      setCards((prev) => prev.filter((c) => c.id !== cardId));
                      router.refresh();
                    }}
                  />
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>

      <DialogAction
        open={dialogDelete.isOpen}
        onRefuse={dialogDelete.close}
        title="Excluir coluna"
        subtitle="Tem certeza que deseja excluir esta coluna?"
        confirmButton={
          <Button
            variant="destructive"
            size="sm"
            onClick={() => [handleDeleteColumn(dialogDelete.state), dialogDelete.close()]}
          >
            Excluir
          </Button>
        }
      />
    </div>
  );
}
