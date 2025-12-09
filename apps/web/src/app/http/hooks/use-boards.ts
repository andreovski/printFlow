import type {
  CreateBoardBody,
  CreateCardBody,
  CreateColumnBody,
  UpdateCardBody,
} from '@magic-system/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createBoard,
  createCard,
  createColumn,
  deleteCard,
  deleteColumn,
  fetchBoards,
  moveCard,
  moveColumn,
  updateCard,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateColumnBody) => createColumn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (columnId: string) => deleteColumn(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCardBody }) => updateCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => deleteCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
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

export function useInvalidateBoards() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['boards'] });
  };
}
