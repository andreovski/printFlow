import type {
  Board,
  BoardColumn,
  Card,
  ChecklistItem,
  CreateBoardBody,
  CreateCardBody,
  CreateColumnBody,
  UpdateCardBody,
  BoardSummary,
  BoardsSummaryResponse,
  UpdateBoardBody,
  ColumnOperation,
} from '@magic-system/schemas';

import { AttachmentsRepository } from '@/repositories/attachments.repository';
import { BoardsRepository } from '@/repositories/boards.repository';
import { BudgetsRepository } from '@/repositories/budgets.repository';

const boardsRepository = new BoardsRepository();
const budgetsRepository = new BudgetsRepository();
const attachmentsRepository = new AttachmentsRepository();

export class BoardsService {
  async createBoard(organizationId: string, data: CreateBoardBody): Promise<Board> {
    // Fallback to default columns if none provided
    const columns =
      data.columns && data.columns.length > 0
        ? data.columns
        : [{ title: 'A Fazer' }, { title: 'Em Andamento' }, { title: 'Feito' }];

    const board = await boardsRepository.create({
      title: data.title,
      description: data.description,
      organizationId,
      columns: {
        create: columns.map((column, index) => ({
          title: column.title,
          order: index,
        })),
      },
    });
    return board as unknown as Board;
  }

  async getBoards(organizationId: string): Promise<Board[]> {
    const boards = await boardsRepository.findMany(organizationId);
    return boards as unknown as Board[];
  }

  async deleteBoard(boardId: string): Promise<void> {
    await boardsRepository.deleteBoard(boardId);
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

  async createCard(
    data: CreateCardBody & { columnId: string },
    organizationId: string
  ): Promise<Card> {
    let budgetAttachments: Array<{
      id: string;
      name: string;
      url: string;
      key: string;
      size: number;
      mimeType: string | null;
    }> = [];

    // Validação do orçamento vinculado
    if (data.budgetId) {
      const budget = await budgetsRepository.findById(data.budgetId);

      if (!budget) {
        throw new Error('Orçamento não encontrado');
      }

      if (budget.status !== 'ACCEPTED') {
        throw new Error('Apenas orçamentos aprovados podem ser vinculados a um cartão');
      }

      // Buscar attachments do orçamento para copiar
      budgetAttachments = await attachmentsRepository.findByBudgetId(data.budgetId);
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
      checklistItems: data.checklistItems,
    });

    // Copiar attachments do orçamento para o card (se houver)
    if (budgetAttachments.length > 0) {
      const attachmentsToCreate = budgetAttachments.map((att) => ({
        name: att.name,
        url: att.url,
        key: `card-ref-${card.id}-${att.key}`, // Nova key única para o card
        size: att.size,
        mimeType: att.mimeType,
        cardId: card.id,
        organizationId,
        sourceBudgetAttachmentId: att.id, // Referência ao original
      }));

      await attachmentsRepository.createMany(attachmentsToCreate);
    }

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

    // If moving to a different column, validate that both boards belong to the same organization
    if (oldColumnId !== destinationColumnId) {
      const sourceColumn = await boardsRepository.findColumnById(oldColumnId);
      const destinationColumn = await boardsRepository.findColumnById(destinationColumnId);

      if (!sourceColumn || !destinationColumn) {
        throw new Error('Column not found');
      }

      // Get boards to check organization
      const sourceBoard = await boardsRepository.findById(sourceColumn.boardId);
      const destinationBoard = await boardsRepository.findById(destinationColumn.boardId);

      if (!sourceBoard || !destinationBoard) {
        throw new Error('Board not found');
      }

      // Validate same organization
      if (sourceBoard.organizationId !== destinationBoard.organizationId) {
        throw new Error('Cannot move card between boards of different organizations');
      }
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
      checklistItems: data.checklistItems,
    });
    return card as unknown as Card;
  }

  async deleteCard(id: string): Promise<void> {
    await boardsRepository.deleteCard(id);
  }

  async archiveCard(id: string, isArchived: boolean): Promise<Card> {
    const card = await boardsRepository.updateCard(id, { isArchived });
    return card as unknown as Card;
  }

  /**
   * Retorna orçamentos aprovados para seleção no vínculo com card.
   * Filtra apenas orçamentos com status ACCEPTED da organização.
   */
  async getApprovedBudgetsForCardLink(organizationId: string, search?: string) {
    return await budgetsRepository.findApprovedForCardLink(organizationId, search);
  }

  /**
   * Alterna o estado de conclusão de um item do checklist.
   */
  async toggleChecklistItem(cardId: string, itemId: string): Promise<ChecklistItem> {
    // Verify the item belongs to the card
    const item = await boardsRepository.findChecklistItemById(itemId);

    if (!item) {
      throw new Error('Checklist item not found');
    }

    if (item.cardId !== cardId) {
      throw new Error('Item does not belong to the specified card');
    }

    const updatedItem = await boardsRepository.toggleChecklistItem(itemId);
    return updatedItem as unknown as ChecklistItem;
  }

  /**
   * Retorna cards arquivados de um board específico.
   */
  async getArchivedCards(boardId: string): Promise<Card[]> {
    const cards = await boardsRepository.findArchivedCardsByBoardId(boardId);
    return cards as unknown as Card[];
  }

  /**
   * Retorna resumo dos boards com contagens otimizadas.
   */
  async getBoardsSummary(
    organizationId: string,
    options: { page: number; pageSize: number; includeArchived: boolean }
  ): Promise<BoardsSummaryResponse> {
    const result = await boardsRepository.findManyWithSummary(organizationId, options);

    return {
      data: result.data.map((board) => ({
        ...board,
        createdAt: board.createdAt.toISOString(),
        updatedAt: board.updatedAt.toISOString(),
      })) as BoardSummary[],
      meta: {
        page: options.page,
        pageSize: options.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / options.pageSize),
      },
    };
  }

  /**
   * Atualiza um board (título, descrição, isArchived) e aplica operações em colunas.
   */
  async updateBoard(boardId: string, data: UpdateBoardBody): Promise<Board> {
    // Update board fields
    if (
      data.title !== undefined ||
      data.description !== undefined ||
      data.isArchived !== undefined
    ) {
      await boardsRepository.updateBoard(boardId, {
        title: data.title,
        description: data.description,
        isArchived: data.isArchived,
      });
    }

    // Process column operations
    if (data.columnOperations && data.columnOperations.length > 0) {
      for (const operation of data.columnOperations) {
        await this.processColumnOperation(boardId, operation);
      }
    }

    // Return updated board
    const board = await boardsRepository.findById(boardId);
    return board as unknown as Board;
  }

  private async processColumnOperation(boardId: string, operation: ColumnOperation): Promise<void> {
    switch (operation.action) {
      case 'rename':
        await boardsRepository.renameColumn(operation.id, operation.title);
        break;

      case 'add':
        const lastOrder = await boardsRepository.getLastColumnOrder(boardId);
        await boardsRepository.createColumn({
          title: operation.title,
          boardId,
          order: lastOrder + 1,
        });
        break;

      case 'delete':
        const cardCount = await boardsRepository.getColumnCardCount(operation.id);
        if (cardCount > 0) {
          throw new Error('Não é possível deletar colunas com cartões');
        }
        await boardsRepository.deleteColumn(operation.id);
        break;

      case 'reorder':
        await boardsRepository.updateManyColumnOrders(boardId, operation.columnOrders);
        break;
    }
  }
}
