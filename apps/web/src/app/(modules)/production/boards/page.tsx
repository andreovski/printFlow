'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useBoards, useCreateBoard } from '@/app/http/hooks/use-boards';
import { Button } from '@/components/ui/button';

import { KanbanView } from './_components/kanban-view';

export default function BoardsPage() {
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  const { data: boards = [], isLoading: loading, error } = useBoards();
  const createBoardMutation = useCreateBoard();

  if (boards.length > 0 && !selectedBoardId) {
    setSelectedBoardId(boards[0].id);
  }

  if (error) {
    toast.error('Erro ao carregar quadros');
  }

  const handleCreateDefaultBoard = async () => {
    try {
      const newBoard = await createBoardMutation.mutateAsync({
        title: 'Produção Geral',
        description: 'Quadro principal de produção',
      });
      setSelectedBoardId(newBoard.id);
      toast.success('Quadro criado com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar quadro');
    }
  };

  if (loading || createBoardMutation.isPending) {
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
        <Button onClick={handleCreateDefaultBoard}>Criar Quadro Padrão</Button>
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

  return (
    <KanbanView boards={boards} selectedBoard={selectedBoard} onBoardChange={setSelectedBoardId} />
  );
}
