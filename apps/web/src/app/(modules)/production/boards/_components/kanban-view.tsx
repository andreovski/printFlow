'use client';

import {
  Plus,
  Trash2,
  ArrowUpDown,
  GripVertical,
  Archive,
  MoreVertical,
  Settings2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  useBoards,
  useDeleteBoard,
  useDeleteColumn,
  useMoveCard,
  useMoveColumn,
} from '@/app/http/hooks/use-boards';
import { Board, Card as ApiCard } from '@/app/http/requests/boards';
import { DialogAction } from '@/components/dialog-action';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useAppContext } from '@/hooks/use-app-context';
import { useDisclosure } from '@/hooks/use-disclosure';
import { cn } from '@/lib/utils';

import { CreateCardDialog } from '../create/create-card-dialog';
import { ArchivedCardsDialog } from './archived-cards-dialog';
import { BoardManagementModal } from './board-management-modal';
import { CreateColumnDialog } from './create-column-dialog';
import { ProductionKanbanCard } from './kanban-card';

interface KanbanViewProps {
  boards: Board[];
  selectedBoard: Board;
  onBoardChange: (boardId: string) => void;
}

export function KanbanView({
  boards: initialBoards,
  selectedBoard: initialSelectedBoard,
  onBoardChange,
}: KanbanViewProps) {
  const { data: boards = initialBoards } = useBoards({ enabled: true });

  const selectedBoard =
    boards.find((b) => b.id === initialSelectedBoard.id) || initialSelectedBoard;

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

  const archiveDialog = useDisclosure();
  const deleteBoardDialog = useDisclosure();
  const managementModal = useDisclosure();

  const { user } = useAppContext();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER';

  const dialogDelete = useDisclosure();
  const moveCardMutation = useMoveCard();
  const deleteColumnMutation = useDeleteColumn();
  const deleteBoardMutation = useDeleteBoard();
  const moveColumnMutation = useMoveColumn();

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

    setCards(newData);
    setActiveDragId(null);

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
        await moveCardMutation.mutateAsync({
          cardId: activeDragId,
          destinationColumnId,
          newPosition,
        });
      } catch (error) {
        toast.error('Erro ao mover cartão');
        console.error(error);
        setCards(cards); // Revert to 'cards' (the old state captured in closure)
      }
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await deleteColumnMutation.mutateAsync(columnId);
      // Optimistic update
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
      toast.success('Coluna excluída com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir coluna. Verifique se ela não possui cartões.');
    }
  };

  const handleDeleteBoard = async () => {
    try {
      await deleteBoardMutation.mutateAsync(selectedBoard.id);
      toast.success('Quadro excluído com sucesso');
      // Select the first available board after deletion
      const remainingBoards = boards.filter((b) => b.id !== selectedBoard.id);
      if (remainingBoards.length > 0) {
        onBoardChange(remainingBoards[0].id);
      }
      deleteBoardDialog.close();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir quadro');
    }
  };

  const handleColumnsReorder = async (newColumns: typeof columns) => {
    const previousColumns = columns;
    setColumns(newColumns);

    try {
      await Promise.all(
        newColumns.map((col, index) =>
          moveColumnMutation.mutateAsync({
            columnId: col.id,
            boardId: selectedBoard.id,
            newOrder: index,
          })
        )
      );
      toast.success('Colunas reordenadas com sucesso');
      // No router.refresh needed, query invalidation handles it
    } catch (error) {
      console.error(error);
      toast.error('Erro ao reordenar colunas');
      setColumns(previousColumns);
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex flex-col gap-8 mb-2">
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

          <Button variant="outline" size="default" onClick={() => managementModal.open()}>
            <Settings2 className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="relative">
                <MoreVertical className="h-4 w-4" />
                {isReorderMode && (
                  <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1 shadow-md animate-in zoom-in-50 fade-in duration-200">
                    <ArrowUpDown className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <CreateColumnDialog
                boardId={selectedBoard.id}
                onColumnCreated={(newColumn) => {
                  setColumns((prev) => [
                    ...prev,
                    { id: newColumn.id, name: newColumn.title, order: newColumn.order },
                  ]);
                }}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Coluna
                </DropdownMenuItem>
              </CreateColumnDialog>

              <DropdownMenuItem
                onClick={() => setIsReorderMode(!isReorderMode)}
                className={cn(
                  isReorderMode &&
                    'bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground'
                )}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {isReorderMode ? 'Ordenar Cartões' : 'Ordenar Colunas'}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => archiveDialog.open()}>
                <Archive className="mr-2 h-4 w-4" />
                Ver Arquivados
              </DropdownMenuItem>

              {isAdmin && (
                <DropdownMenuItem
                  onClick={() => deleteBoardDialog.open()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Quadro
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
            <KanbanBoard
              id={column.id}
              key={column.id}
              className="min-w-[260px] min-h-fit flex flex-col"
            >
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
                      // Hook calls invalidateQueries
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
                      // Hook calls invalidateQueries
                    }}
                    onCardDeleted={(cardId: string) => {
                      setCards((prev) => prev.filter((c) => c.id !== cardId));
                      // Hook calls invalidateQueries
                    }}
                  />
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>

      <ArchivedCardsDialog
        boardId={selectedBoard.id}
        open={archiveDialog.isOpen}
        onOpenChange={() => archiveDialog.toggle()}
        onCardUpdated={() => {}}
        onCardDeleted={() => {}}
      />

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

      <DialogAction
        open={deleteBoardDialog.isOpen}
        onRefuse={deleteBoardDialog.close}
        title="Excluir quadro"
        subtitle={`Tem certeza que deseja excluir o quadro "${selectedBoard.title}"? Esta ação irá excluir permanentemente todas as colunas e cartões deste quadro.`}
        confirmButton={
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteBoard}
            disabled={deleteBoardMutation.isPending}
          >
            {deleteBoardMutation.isPending ? 'Excluindo...' : 'Excluir Quadro'}
          </Button>
        }
      />

      <BoardManagementModal
        open={managementModal.isOpen}
        onOpenChange={(open) => {
          if (!open) managementModal.close();
          else managementModal.open();
        }}
        onBoardSelect={(boardId) => {
          onBoardChange(boardId);
          managementModal.close();
        }}
      />
    </div>
  );
}
