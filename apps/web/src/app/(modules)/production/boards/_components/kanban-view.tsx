'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Board, moveCard, Card as ApiCard, deleteColumn } from '@/app/http/requests/boards';
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
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';

import { CreateCardDialog } from './create-card-dialog';
import { CreateColumnDialog } from './create-column-dialog';
import { EditCardDialog } from './edit-card-dialog';

interface KanbanViewProps {
  boards: Board[];
  selectedBoard: Board;
  onBoardChange: (boardId: string) => void;
}

export function KanbanView({ boards, selectedBoard, onBoardChange }: KanbanViewProps) {
  const router = useRouter();
  const [columns, setColumns] = useState(
    (selectedBoard.columns || []).map((col) => ({
      id: col.id,
      name: col.title,
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

  // Update columns and cards when selectedBoard changes
  useEffect(() => {
    const newColumns = (selectedBoard.columns || []).map((col) => ({
      id: col.id,
      name: col.title,
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
    if (!confirm('Tem certeza que deseja excluir esta coluna?')) return;

    try {
      await deleteColumn(columnId);
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      toast.success('Coluna excluída com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir coluna. Verifique se ela não possui cartões.');
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex flex-col gap-8 mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Quadros</h1>
        <div className="flex items-center gap-3">
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
              setColumns((prev) => [...prev, { id: newColumn.id, name: newColumn.title }]);
              router.refresh();
            }}
          >
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nova Coluna
            </Button>
          </CreateColumnDialog>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pt-0">
        <KanbanProvider
          columns={columns}
          data={cards}
          onDataChange={onDataChange}
          onDragStart={onDragStart}
        >
          {(column) => (
            <KanbanBoard id={column.id} key={column.id} className="min-w-[220px]">
              <KanbanHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{column.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteColumn(column.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(item) => (
                  <KanbanCard id={item.id} name={item.name} column={item.column} key={item.id}>
                    <EditCardDialog
                      card={item as unknown as ApiCard}
                      onCardUpdated={(updatedCard) => {
                        setCards((prev) =>
                          prev.map((c) =>
                            c.id === updatedCard.id
                              ? { ...updatedCard, name: updatedCard.title, column: item.column }
                              : c
                          )
                        );
                        router.refresh();
                      }}
                    >
                      <div className="flex flex-col gap-2">
                        <span className="font-medium">{item.name}</span>
                        <>
                          {item.description && (
                            <span className="text-xs text-muted-foreground line-clamp-2">
                              {String(item.description)}
                            </span>
                          )}
                        </>
                      </div>
                    </EditCardDialog>
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
