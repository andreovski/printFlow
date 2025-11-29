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
              include: {
                tags: true,
              },
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
              include: {
                tags: true,
              },
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
        cards: {
          include: {
            tags: true,
          },
        },
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

  async createCard(data: Prisma.CardUncheckedCreateInput & { tagIds?: string[] }): Promise<Card> {
    const lastCard = await prisma.card.findFirst({
      where: { columnId: data.columnId },
      orderBy: { position: 'desc' },
    });

    const position = lastCard ? lastCard.position + 1 : 0;

    const { tagIds, ...rest } = data;

    return await prisma.card.create({
      data: {
        ...rest,
        position,
        tags: tagIds
          ? {
              connect: tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        tags: true,
      },
    });
  }

  async updateCard(
    id: string,
    data: Prisma.CardUncheckedUpdateInput & { tagIds?: string[] }
  ): Promise<Card> {
    const { tagIds, ...rest } = data;

    return await prisma.card.update({
      where: { id },
      data: {
        ...rest,
        tags: tagIds
          ? {
              set: tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        tags: true,
      },
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
      include: {
        tags: true,
      },
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

  async updateColumnOrder(columnId: string, order: number): Promise<void> {
    await prisma.boardColumn.update({
      where: { id: columnId },
      data: { order },
    });
  }

  async updateManyColumnOrders(
    boardId: string,
    updates: { id: string; order: number }[]
  ): Promise<void> {
    await prisma.$transaction(
      updates.map(({ id, order }) =>
        prisma.boardColumn.update({
          where: { id },
          data: { order },
        })
      )
    );
  }

  async findColumnsByBoardId(boardId: string): Promise<BoardColumn[]> {
    return await prisma.boardColumn.findMany({
      where: { boardId },
      orderBy: { order: 'asc' },
    });
  }
}
