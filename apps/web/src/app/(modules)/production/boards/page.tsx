'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useBoards } from '@/app/http/hooks/use-boards';
import { Button } from '@/components/ui/button';

import { CreateBoardDialog } from './_components/create-board-dialog';
import { KanbanView } from './_components/kanban-view';

export default function BoardsPage() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastSelectedBoardId');
    }
    return null;
  });

  const { data: boards = [], isLoading: loading, error } = useBoards();

  if (boards.length > 0 && !selectedBoardId) {
    const lastBoardId = boards[0].id;
    setSelectedBoardId(lastBoardId);
    localStorage.setItem('lastSelectedBoardId', lastBoardId);
  }

  if (error) {
    toast.error('Erro ao carregar quadros');
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Nenhum quadro encontrado</h2>
        <p className="text-muted-foreground">
          Crie seu primeiro quadro para começar a organizar a produção.
        </p>
        <CreateBoardDialog
          onBoardCreated={(newBoard) => {
            setSelectedBoardId(newBoard.id);
            localStorage.setItem('lastSelectedBoardId', newBoard.id);
          }}
        >
          <Button>Criar Novo Quadro</Button>
        </CreateBoardDialog>
      </div>
    );
  }

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  if (!selectedBoard) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    localStorage.setItem('lastSelectedBoardId', boardId);
  };

  return (
    <KanbanView boards={boards} selectedBoard={selectedBoard} onBoardChange={handleBoardChange} />
  );
}
