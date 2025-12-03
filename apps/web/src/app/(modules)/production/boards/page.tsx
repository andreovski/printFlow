'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Board, createBoard, fetchBoards } from '@/app/http/requests/boards';
import { Button } from '@/components/ui/button';

import { KanbanView } from './_components/kanban-view';

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await fetchBoards();
      setBoards(data);
      // Set the first board as selected by default
      if (data.length > 0) {
        setSelectedBoardId(data[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar quadros');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefaultBoard = async () => {
    try {
      setLoading(true);
      const newBoard = await createBoard({
        title: 'Produção Geral',
        description: 'Quadro principal de produção',
      });
      setBoards([newBoard]);
      setSelectedBoardId(newBoard.id);
      toast.success('Quadro criado com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar quadro');
    } finally {
      setLoading(false);
    }
  };

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
