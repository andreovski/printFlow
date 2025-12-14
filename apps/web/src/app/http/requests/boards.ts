import type {
  Board,
  BoardColumn,
  Card,
  ChecklistItem,
  CreateBoardBody,
  CreateCardBody,
  CreateColumnBody,
  UpdateCardBody,
  ApprovedBudgetOptionsResponse,
} from '@magic-system/schemas';

import { api } from '../api';

export type { Board, Card, ChecklistItem };

export async function fetchBoards(): Promise<Board[]> {
  const response = await api.get('boards');
  return response.json();
}

export async function fetchApprovedBudgets(
  search?: string
): Promise<ApprovedBudgetOptionsResponse> {
  const searchParams = new URLSearchParams();
  if (search) {
    searchParams.set('search', search);
  }
  const query = searchParams.toString();
  const url = query ? `boards/approved-budgets?${query}` : 'boards/approved-budgets';
  const response = await api.get(url);
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

export async function toggleChecklistItem(cardId: string, itemId: string): Promise<ChecklistItem> {
  const response = await api.patch(`cards/${cardId}/checklist/${itemId}/toggle`, { json: {} });
  return response.json();
}

export async function archiveCard(id: string, isArchived: boolean): Promise<Card> {
  const response = await api.patch(`cards/${id}/archive`, { json: { isArchived } });
  return response.json();
}

export async function fetchArchivedCards(boardId: string): Promise<Card[]> {
  const response = await api.get(`boards/${boardId}/archived-cards`);
  return response.json();
}
