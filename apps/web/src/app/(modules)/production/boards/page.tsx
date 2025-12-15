'use client';

import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useBoards } from '@/app/http/hooks/use-boards';
import { fetchArchivedCards } from '@/app/http/requests/boards';
import { Button } from '@/components/ui/button';

import { CreateBoardDialog } from './_components/create-board-dialog';
import { KanbanView } from './_components/kanban-view';
import { EditCardDialog } from './edit/edit-card-dialog';

export default function BoardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardIdFromUrl = searchParams.get('cardId');

  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastSelectedBoardId');
    }
    return null;
  });
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  const { data: boards = [], isLoading: loading, error } = useBoards();

  // Handle cardId from URL
  useEffect(() => {
    const findAndOpenCard = async () => {
      if (!cardIdFromUrl || boards.length === 0) return;

      // Find the card in all boards (including active cards)
      let foundCard = null;
      let foundBoardId = null;

      for (const board of boards) {
        for (const column of board.columns) {
          const card = column.cards.find((c) => c.id === cardIdFromUrl);
          if (card) {
            foundCard = card;
            foundBoardId = board.id;
            break;
          }
        }
        if (foundCard) break;
      }

      // If not found in active cards, search in archived cards of all boards
      if (!foundCard) {
        for (const board of boards) {
          try {
            const archivedCards = await fetchArchivedCards(board.id);
            const archivedCard = archivedCards.find((c) => c.id === cardIdFromUrl);
            if (archivedCard) {
              foundCard = archivedCard;
              foundBoardId = board.id;
              break;
            }
          } catch (err) {
            console.error(`Error fetching archived cards for board ${board.id}:`, err);
          }
        }
      }

      if (foundCard && foundBoardId) {
        // Set the board if different
        if (selectedBoardId !== foundBoardId) {
          setSelectedBoardId(foundBoardId);
          localStorage.setItem('lastSelectedBoardId', foundBoardId);
        }
        // Open the card dialog
        setSelectedCard(foundCard);
        setCardDialogOpen(true);
      } else {
        toast.error('Card não encontrado');
        router.push('/production/boards', { scroll: false });
      }
    };

    findAndOpenCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIdFromUrl]);

  // Handle closing card dialog
  const handleCardDialogClose = (open: boolean) => {
    setCardDialogOpen(open);
    if (!open) {
      // Remove cardId from URL
      router.push('/production/boards', { scroll: false });
      setSelectedCard(null);
    }
  };

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
    <>
      <KanbanView boards={boards} selectedBoard={selectedBoard} onBoardChange={handleBoardChange} />

      {/* Card dialog opened via URL */}
      {selectedCard && (
        <EditCardDialog
          card={selectedCard}
          boardId={selectedBoard.id}
          columnId={selectedCard.columnId}
          open={cardDialogOpen}
          onOpenChange={handleCardDialogClose}
          onCardUpdated={() => {}}
          onCardDeleted={() => {
            setCardDialogOpen(false);
            router.push('/production/boards', { scroll: false });
          }}
        />
      )}
    </>
  );
}
