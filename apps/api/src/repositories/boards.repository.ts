import { Board, BoardColumn, Card, Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export class BoardsRepository {
  async create(data: Prisma.BoardUncheckedCreateInput): Promise<Board> {
    return await prisma.board.create({
      data,
      include: {
        columns: {
          include: {
            cards: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async findMany(organizationId: string): Promise<Board[]> {
    return await prisma.board.findMany({
      where: {
        organizationId,
        isArchived: false,
      },
      include: {
        columns: {
          include: {
            cards: {
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string): Promise<Board | null> {
    return await prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          include: {
            cards: {
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  async findColumnById(id: string): Promise<BoardColumn | null> {
    return await prisma.boardColumn.findUnique({
      where: { id },
      include: {
        cards: true,
      },
    });
  }

  async getLastColumnOrder(boardId: string): Promise<number> {
    const lastColumn = await prisma.boardColumn.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' },
    });
    return lastColumn ? lastColumn.order : -1;
  }

  async createColumn(data: Prisma.BoardColumnUncheckedCreateInput): Promise<BoardColumn> {
    return await prisma.boardColumn.create({
      data,
    });
  }

  async deleteColumn(id: string): Promise<void> {
    await prisma.boardColumn.delete({
      where: { id },
    });
  }

  async createCard(data: Prisma.CardUncheckedCreateInput): Promise<Card> {
    const lastCard = await prisma.card.findFirst({
      where: { columnId: data.columnId },
      orderBy: { position: 'desc' },
    });

    const position = lastCard ? lastCard.position + 1 : 0;

    return await prisma.card.create({
      data: {
        ...data,
        position,
      },
    });
  }

  async updateCard(id: string, data: Prisma.CardUncheckedUpdateInput): Promise<Card> {
    return await prisma.card.update({
      where: { id },
      data,
    });
  }

  async deleteCard(id: string): Promise<void> {
    await prisma.card.delete({
      where: { id },
    });
  }

  async findCardById(id: string): Promise<Card | null> {
    return await prisma.card.findUnique({
      where: { id },
    });
  }

  async decrementPositions(
    columnId: string,
    fromPosition: number,
    toPosition: number
  ): Promise<void> {
    await prisma.card.updateMany({
      where: {
        columnId,
        position: { gt: fromPosition, lte: toPosition },
      },
      data: { position: { decrement: 1 } },
    });
  }

  async incrementPositions(
    columnId: string,
    fromPosition: number,
    toPosition: number
  ): Promise<void> {
    await prisma.card.updateMany({
      where: {
        columnId,
        position: { gte: fromPosition, lt: toPosition },
      },
      data: { position: { increment: 1 } },
    });
  }

  async shiftPositionsAfterRemoval(columnId: string, fromPosition: number): Promise<void> {
    await prisma.card.updateMany({
      where: {
        columnId,
        position: { gt: fromPosition },
      },
      data: { position: { decrement: 1 } },
    });
  }

  async shiftPositionsForInsertion(columnId: string, fromPosition: number): Promise<void> {
    await prisma.card.updateMany({
      where: {
        columnId,
        position: { gte: fromPosition },
      },
      data: { position: { increment: 1 } },
    });
  }

  async updateCardPosition(cardId: string, columnId: string, position: number): Promise<void> {
    await prisma.card.update({
      where: { id: cardId },
      data: {
        columnId,
        position,
      },
    });
  }
}
