import { Board, BoardColumn, Card, CardChecklistItem, Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

// Common include for card queries with checklistItems
const cardInclude = {
  tags: true,
  checklistItems: {
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
  attachments: {
    select: {
      id: true,
      name: true,
      url: true,
      mimeType: true,
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
  budget: {
    select: {
      id: true,
      code: true,
      client: {
        select: {
          name: true,
          phone: true,
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
        },
      },
    },
  },
};

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
              where: {
                isArchived: false,
              },
              include: cardInclude,
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
                ...cardInclude,
                budget: {
                  select: {
                    id: true,
                    code: true,
                    client: {
                      select: {
                        name: true,
                      },
                    },
                    items: {
                      select: {
                        name: true,
                        quantity: true,
                      },
                    },
                  },
                },
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
          include: cardInclude,
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

  async deleteBoard(id: string): Promise<void> {
    await prisma.board.delete({
      where: { id },
    });
  }

  async deleteColumn(id: string): Promise<void> {
    await prisma.boardColumn.delete({
      where: { id },
    });
  }

  async createCard(
    data: Prisma.CardUncheckedCreateInput & {
      tagIds?: string[];
      checklistItems?: { name: string; isCompleted?: boolean }[];
    }
  ): Promise<Card> {
    const lastCard = await prisma.card.findFirst({
      where: { columnId: data.columnId },
      orderBy: { position: 'desc' },
    });

    const position = lastCard ? lastCard.position + 1 : 0;

    const { tagIds, checklistItems, ...rest } = data;

    return await prisma.card.create({
      data: {
        ...rest,
        position,
        tags: tagIds
          ? {
              connect: tagIds.map((id) => ({ id })),
            }
          : undefined,
        checklistItems: checklistItems
          ? {
              create: checklistItems.map((item) => ({
                name: item.name,
                isCompleted: item.isCompleted ?? false,
              })),
            }
          : undefined,
      },
      include: cardInclude,
    });
  }

  async updateCard(
    id: string,
    data: Prisma.CardUncheckedUpdateInput & {
      tagIds?: string[];
      checklistItems?: { id?: string; name: string; isCompleted?: boolean }[];
    }
  ): Promise<Card> {
    const { tagIds, checklistItems, ...rest } = data;

    // If checklistItems is provided, we need to handle them with a transaction
    if (checklistItems !== undefined) {
      return await prisma.$transaction(async (tx) => {
        // Delete all existing checklist items
        await tx.cardChecklistItem.deleteMany({
          where: { cardId: id },
        });

        // Update the card with new data and create new checklist items
        return await tx.card.update({
          where: { id },
          data: {
            ...rest,
            tags: tagIds
              ? {
                  set: tagIds.map((id) => ({ id })),
                }
              : undefined,
            checklistItems: {
              create: checklistItems.map((item) => ({
                name: item.name,
                isCompleted: item.isCompleted ?? false,
              })),
            },
          },
          include: cardInclude,
        });
      });
    }

    // If no checklistItems provided, just update the card normally
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
      include: cardInclude,
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
      include: cardInclude,
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

  async findChecklistItemById(itemId: string): Promise<CardChecklistItem | null> {
    return await prisma.cardChecklistItem.findUnique({
      where: { id: itemId },
    });
  }

  async toggleChecklistItem(itemId: string): Promise<CardChecklistItem> {
    const item = await prisma.cardChecklistItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('Checklist item not found');
    }

    return await prisma.cardChecklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted: !item.isCompleted,
      },
    });
  }

  async findArchivedCardsByBoardId(boardId: string): Promise<Card[]> {
    return await prisma.card.findMany({
      where: {
        column: {
          boardId,
        },
        isArchived: true,
      },
      include: cardInclude,
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}
