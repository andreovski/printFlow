import type {
  CreateBoardBody,
  CreateCardBody,
  CreateColumnBody,
  UpdateCardBody,
} from '@magic-system/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  Board,
  createBoard,
  createCard,
  createColumn,
  deleteBoard,
  deleteCard,
  deleteColumn,
  fetchBoards,
  moveCard,
  moveColumn,
  updateCard,
  archiveCard,
  fetchArchivedCards,
} from '@/app/http/requests/boards';

export function useBoards({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['boards'],
    queryFn: () => fetchBoards(),
    enabled,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBoardBody) => createBoard(data),
    onSuccess: (newBoard) => {
      queryClient.setQueryData<Board[]>(['boards'], (old) => {
        return old ? [newBoard, ...old] : [newBoard];
      });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) => deleteBoard(boardId),
    onSuccess: (_, boardId) => {
      queryClient.setQueryData<Board[]>(['boards'], (old) => {
        if (!old) return old;
        return old.filter((board) => board.id !== boardId);
      });
    },
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateColumnBody) => createColumn(data),
    onSuccess: (newColumn) => {
      queryClient.setQueryData<Board[]>(['boards'], (old) => {
        if (!old) return old;
        return old.map((board) => {
          if (board.id === newColumn.boardId) {
            return {
              ...board,
              columns: [...(board.columns || []), newColumn],
            };
          }
          return board;
        });
      });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(columnId),
    onSuccess: (_, columnId) => {
      queryClient.setQueryData<Board[]>(['boards'], (old) => {
        if (!old) return old;
        return old.map((board) => ({
          ...board,
          columns: (board.columns || []).filter((col) => col.id !== columnId),
        }));
      });
    },
  });
}

export function useMoveColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      columnId,
      boardId,
      newOrder,
    }: {
      columnId: string;
      boardId: string;
      newOrder: number;
    }) => moveColumn(columnId, boardId, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ columnId, data }: { columnId: string; data: CreateCardBody }) =>
      createCard(columnId, data),
    onSuccess: (newCard, { columnId }) => {
      queryClient.setQueryData<Board[]>(['boards'], (old) => {
        if (!old) return old;
        return old.map((board) => ({
          ...board,
          columns: (board.columns || []).map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: [...(col.cards || []), newCard],
              };
            }
            return col;
          }),
        }));
      });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCardBody }) => updateCard(id, data),
    onSuccess: (updatedCard) => {
      queryClient.setQueryData<Board[]>(['boards'], (old) => {
        if (!old) return old;
        return old.map((board) => ({
          ...board,
          columns: (board.columns || []).map((col) => ({
            ...col,
            cards: (col.cards || []).map((card) =>
              card.id === updatedCard.id ? { ...card, ...updatedCard } : card
            ),
          })),
        }));
      });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => deleteCard(cardId),
    onSuccess: (_, cardId) => {
      queryClient.setQueryData<Board[]>(['boards'], (old) => {
        if (!old) return old;
        return old.map((board) => ({
          ...board,
          columns: (board.columns || []).map((col) => ({
            ...col,
            cards: (col.cards || []).filter((card) => card.id !== cardId),
          })),
        }));
      });
    },
  });
}

export function useMoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cardId,
      destinationColumnId,
      newPosition,
    }: {
      cardId: string;
      destinationColumnId: string;
      newPosition: number;
    }) => moveCard(cardId, destinationColumnId, newPosition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useArchiveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      archiveCard(id, isArchived),
    onSuccess: () => {
      // Invalidate boards to refresh the main kanban view (removes archived cards)
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      // Invalidate archived-cards to refresh the archived dialog (adds/removes cards)
      queryClient.invalidateQueries({ queryKey: ['archived-cards'] });
    },
  });
}

export function useArchivedCards(boardId: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ['archived-cards', boardId],
    queryFn: () => fetchArchivedCards(boardId),
    enabled,
  });
}

export function useInvalidateBoards() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['boards'] });
  };
}
