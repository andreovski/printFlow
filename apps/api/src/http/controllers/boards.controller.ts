import {
  cardIdParamsSchema,
  checklistItemToggleParamsSchema,
  columnIdParamsSchema,
  createBoardBodySchema,
  createCardBodySchema,
  createColumnBodySchema,
  moveCardBodySchema,
  moveColumnBodySchema,
  updateCardBodySchema,
  approvedBudgetOptionsQuerySchema,
  archiveCardBodySchema,
  deleteBoardParamsSchema,
  boardIdParamsSchema,
  boardsSummaryQuerySchema,
  updateBoardBodySchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { BoardsService } from '@/services/boards.service';

const boardsService = new BoardsService();

export async function createBoardController(request: FastifyRequest, reply: FastifyReply) {
  const { title, description, columns } = createBoardBodySchema.parse(request.body);
  const organizationId = request.user.organizationId;

  if (!organizationId) {
    return reply.status(400).send({ message: 'Organization ID is required' });
  }

  const board = await boardsService.createBoard(organizationId, { title, description, columns });

  return reply.status(201).send(board);
}

export async function fetchBoardsController(request: FastifyRequest, reply: FastifyReply) {
  const organizationId = request.user.organizationId;

  if (!organizationId) {
    return reply.status(400).send({ message: 'Organization ID is required' });
  }

  const boards = await boardsService.getBoards(organizationId);

  return reply.status(200).send(boards);
}

export async function deleteBoardController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = deleteBoardParamsSchema.parse(request.params);

  await boardsService.deleteBoard(id);

  return reply.status(204).send();
}

export async function createColumnController(request: FastifyRequest, reply: FastifyReply) {
  const { title, boardId } = createColumnBodySchema.parse(request.body);

  const column = await boardsService.createColumn({ title, boardId });

  return reply.status(201).send(column);
}

export async function deleteColumnController(request: FastifyRequest, reply: FastifyReply) {
  const { columnId } = columnIdParamsSchema.parse(request.params);

  try {
    await boardsService.deleteColumn(columnId);
    return reply.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Não é possível deletar colunas com cartões') {
      return reply.status(400).send({ message: error.message });
    }
    throw error;
  }
}

export async function moveColumnController(request: FastifyRequest, reply: FastifyReply) {
  const { columnId, boardId, newOrder } = moveColumnBodySchema.parse(request.body);

  await boardsService.moveColumn(columnId, boardId, newOrder);

  return reply.status(204).send();
}

export async function createCardController(request: FastifyRequest, reply: FastifyReply) {
  const { title, description, priority, dueDate, tagIds, budgetId, checklistItems } =
    createCardBodySchema.parse(request.body);
  const { columnId } = columnIdParamsSchema.parse(request.params);
  const { organizationId } = request.user as { organizationId: string };

  try {
    const card = await boardsService.createCard(
      {
        title,
        description,
        priority,
        dueDate,
        columnId,
        tagIds,
        budgetId,
        checklistItems,
      },
      organizationId
    );

    return reply.status(201).send(card);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.message === 'Orçamento não encontrado' ||
        error.message === 'Apenas orçamentos aprovados podem ser vinculados a um cartão'
      ) {
        return reply.status(400).send({ message: error.message });
      }
    }
    throw error;
  }
}

export async function moveCardController(request: FastifyRequest, reply: FastifyReply) {
  const { cardId, destinationColumnId, newPosition } = moveCardBodySchema.parse(request.body);

  await boardsService.moveCard(cardId, destinationColumnId, newPosition);

  return reply.status(204).send();
}

export async function updateCardController(request: FastifyRequest, reply: FastifyReply) {
  const data = updateCardBodySchema.parse(request.body);
  const { id } = cardIdParamsSchema.parse(request.params);

  const card = await boardsService.updateCard(id, data);

  return reply.status(200).send(card);
}

export async function deleteCardController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = cardIdParamsSchema.parse(request.params);

  await boardsService.deleteCard(id);

  return reply.status(204).send();
}

export async function fetchApprovedBudgetsController(request: FastifyRequest, reply: FastifyReply) {
  const organizationId = request.user.organizationId;

  if (!organizationId) {
    return reply.status(400).send({ message: 'Organization ID is required' });
  }

  const { search } = approvedBudgetOptionsQuerySchema.parse(request.query);

  const budgets = await boardsService.getApprovedBudgetsForCardLink(organizationId, search);

  return reply.status(200).send({ data: budgets });
}

export async function toggleChecklistItemController(request: FastifyRequest, reply: FastifyReply) {
  const { cardId, itemId } = checklistItemToggleParamsSchema.parse(request.params);

  try {
    const item = await boardsService.toggleChecklistItem(cardId, itemId);
    return reply.status(200).send(item);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'Checklist item not found') {
        return reply.status(404).send({ message: 'Item não encontrado' });
      }
      if (error.message === 'Item does not belong to the specified card') {
        return reply.status(400).send({ message: 'Item não pertence ao cartão especificado' });
      }
    }
    throw error;
  }
}

export async function archiveCardController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = cardIdParamsSchema.parse(request.params);
  const { isArchived } = archiveCardBodySchema.parse(request.body);

  const card = await boardsService.archiveCard(id, isArchived);

  return reply.status(200).send(card);
}

export async function getArchivedCardsController(request: FastifyRequest, reply: FastifyReply) {
  const { boardId } = request.params as { boardId: string };

  const cards = await boardsService.getArchivedCards(boardId);

  return reply.status(200).send(cards);
}

export async function fetchBoardsSummaryController(request: FastifyRequest, reply: FastifyReply) {
  const organizationId = request.user.organizationId;

  if (!organizationId) {
    return reply.status(400).send({ message: 'Organization ID is required' });
  }

  const { page, pageSize, includeArchived } = boardsSummaryQuerySchema.parse(request.query);

  const result = await boardsService.getBoardsSummary(organizationId, {
    page,
    pageSize,
    includeArchived,
  });

  return reply.status(200).send(result);
}

export async function updateBoardController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = boardIdParamsSchema.parse(request.params);
  const data = updateBoardBodySchema.parse(request.body);

  try {
    const board = await boardsService.updateBoard(id, data);
    return reply.status(200).send(board);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'Não é possível deletar colunas com cartões') {
        return reply.status(400).send({ message: error.message });
      }
    }
    throw error;
  }
}
