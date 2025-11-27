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

const boardsRepository = new BoardsRepository();

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

  async createCard(data: CreateCardBody & { columnId: string }): Promise<Card> {
    const card = await boardsRepository.createCard({
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      columnId: data.columnId,
      position: 0,
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
    const card = await boardsRepository.updateCard(id, data);
    return card as unknown as Card;
  }

  async deleteCard(id: string): Promise<void> {
    await boardsRepository.deleteCard(id);
  }
}
