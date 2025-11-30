import type {
  Board,
  BoardColumn,
  Card,
  CreateBoardBody,
  CreateCardBody,
  CreateColumnBody,
  UpdateCardBody,
} from '@magic-system/schemas';

import { BoardsRepository } from '@/repositories/boards.repository';
import { BudgetsRepository } from '@/repositories/budgets.repository';

const boardsRepository = new BoardsRepository();
const budgetsRepository = new BudgetsRepository();

export class BoardsService {
  async createBoard(organizationId: string, data: CreateBoardBody): Promise<Board> {
    const board = await boardsRepository.create({
      title: data.title,
      description: data.description,
      organizationId,
      columns: {
        create: [
          { title: 'A Fazer', order: 0 },
          { title: 'Em Andamento', order: 1 },
          { title: 'Feito', order: 2 },
        ],
      },
    });
    return board as unknown as Board;
  }

  async getBoards(organizationId: string): Promise<Board[]> {
    const boards = await boardsRepository.findMany(organizationId);
    return boards as unknown as Board[];
  }

  async createColumn(data: CreateColumnBody): Promise<BoardColumn> {
    const lastOrder = await boardsRepository.getLastColumnOrder(data.boardId);
    const column = await boardsRepository.createColumn({
      title: data.title,
      boardId: data.boardId,
      order: lastOrder + 1,
    });
    return column as unknown as BoardColumn;
  }

  async deleteColumn(columnId: string): Promise<void> {
    const column = await boardsRepository.findColumnById(columnId);

    if (!column) {
      throw new Error('Column not found');
    }

    // @ts-ignore - Prisma types vs Schema types mismatch
    if (column.cards && column.cards.length > 0) {
      throw new Error('Não é possível deletar colunas com cartões');
    }

    await boardsRepository.deleteColumn(columnId);
  }

  async moveColumn(columnId: string, boardId: string, newOrder: number): Promise<void> {
    const columns = await boardsRepository.findColumnsByBoardId(boardId);

    const columnToMove = columns.find((col) => col.id === columnId);
    if (!columnToMove) {
      throw new Error('Column not found');
    }

    const oldOrder = columnToMove.order;

    if (oldOrder === newOrder) {
      return;
    }

    // Reorder all columns
    const updates: { id: string; order: number }[] = [];

    columns.forEach((col) => {
      if (col.id === columnId) {
        updates.push({ id: col.id, order: newOrder });
      } else if (oldOrder < newOrder && col.order > oldOrder && col.order <= newOrder) {
        // Moving right: shift columns left
        updates.push({ id: col.id, order: col.order - 1 });
      } else if (oldOrder > newOrder && col.order >= newOrder && col.order < oldOrder) {
        // Moving left: shift columns right
        updates.push({ id: col.id, order: col.order + 1 });
      } else {
        updates.push({ id: col.id, order: col.order });
      }
    });

    await boardsRepository.updateManyColumnOrders(boardId, updates);
  }

  async createCard(data: CreateCardBody & { columnId: string }): Promise<Card> {
    // Validação do orçamento vinculado
    if (data.budgetId) {
      const budget = await budgetsRepository.findById(data.budgetId);

      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }

      if (budget.status !== 'ACCEPTED') {
        throw new Error('Apenas orçamentos aprovados podem ser vinculados a um cartão');
      }
    }

    const card = await boardsRepository.createCard({
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      columnId: data.columnId,
      budgetId: data.budgetId || null,
      position: 0,
      tagIds: (data as any).tagIds,
    });
    return card as unknown as Card;
  }

  async moveCard(cardId: string, destinationColumnId: string, newPosition: number): Promise<void> {
    const card = await boardsRepository.findCardById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    const oldColumnId = card.columnId;
    const oldPosition = card.position;

    if (oldColumnId === destinationColumnId && oldPosition === newPosition) {
      return;
    }

    if (oldColumnId === destinationColumnId) {
      await this.moveCardWithinSameColumn(cardId, oldPosition, newPosition, oldColumnId);
    } else {
      await this.moveCardToDifferentColumn(
        cardId,
        oldColumnId,
        oldPosition,
        destinationColumnId,
        newPosition
      );
    }
  }

  private async moveCardWithinSameColumn(
    cardId: string,
    oldPosition: number,
    newPosition: number,
    columnId: string
  ): Promise<void> {
    if (newPosition > oldPosition) {
      await boardsRepository.decrementPositions(columnId, oldPosition, newPosition);
    } else {
      await boardsRepository.incrementPositions(columnId, newPosition, oldPosition);
    }

    await boardsRepository.updateCardPosition(cardId, columnId, newPosition);
  }

  private async moveCardToDifferentColumn(
    cardId: string,
    oldColumnId: string,
    oldPosition: number,
    destinationColumnId: string,
    newPosition: number
  ): Promise<void> {
    await boardsRepository.shiftPositionsAfterRemoval(oldColumnId, oldPosition);
    await boardsRepository.shiftPositionsForInsertion(destinationColumnId, newPosition);
    await boardsRepository.updateCardPosition(cardId, destinationColumnId, newPosition);
  }

  async updateCard(id: string, data: UpdateCardBody): Promise<Card> {
    const card = await boardsRepository.updateCard(id, {
      ...data,
      tagIds: (data as any).tagIds,
    });
    return card as unknown as Card;
  }

  async deleteCard(id: string): Promise<void> {
    await boardsRepository.deleteCard(id);
  }

  /**
   * Retorna orçamentos aprovados para seleção no vínculo com card.
   * Filtra apenas orçamentos com status ACCEPTED da organização.
   */
  async getApprovedBudgetsForCardLink(organizationId: string, search?: string) {
    return await budgetsRepository.findApprovedForCardLink(organizationId, search);
  }
}
