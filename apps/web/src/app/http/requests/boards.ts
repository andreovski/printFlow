import type {
  Board,
  BoardColumn,
  Card,
  CreateBoardBody,
  CreateCardBody,
  CreateColumnBody,
  UpdateCardBody,
} from '@magic-system/schemas';

import { api } from '../api';

export type { Board, Card };

export async function fetchBoards(): Promise<Board[]> {
  const response = await api.get('boards');
  return response.json();
}

export async function createBoard(data: CreateBoardBody): Promise<Board> {
  const response = await api.post('boards', { json: data });
  return response.json();
}

export async function createColumn(data: CreateColumnBody): Promise<BoardColumn> {
  const response = await api.post('columns', { json: data });
  return response.json();
}

export async function deleteColumn(columnId: string): Promise<void> {
  await api.delete(`columns/${columnId}`);
}

export async function createCard(columnId: string, data: CreateCardBody): Promise<Card> {
  const response = await api.post(`columns/${columnId}/cards`, { json: data });
  return response.json();
}

export async function moveCard(
  cardId: string,
  destinationColumnId: string,
  newPosition: number
): Promise<void> {
  await api.patch('cards/move', {
    json: {
      cardId,
      destinationColumnId,
      newPosition,
    },
  });
}

export async function moveColumn(
  columnId: string,
  boardId: string,
  newOrder: number
): Promise<void> {
  await api.patch('columns/move', {
    json: {
      columnId,
      boardId,
      newOrder,
    },
  });
}

export async function updateCard(id: string, data: UpdateCardBody): Promise<Card> {
  const response = await api.put(`cards/${id}`, { json: data });
  return response.json();
}

export async function deleteCard(id: string): Promise<void> {
  await api.delete(`cards/${id}`);
}
