import {
  cardIdParamsSchema,
  columnIdParamsSchema,
  createBoardBodySchema,
  createCardBodySchema,
  createColumnBodySchema,
  moveCardBodySchema,
  moveColumnBodySchema,
  updateCardBodySchema,
  approvedBudgetOptionsQuerySchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { BoardsService } from '@/services/boards.service';

const boardsService = new BoardsService();

export async function createBoardController(request: FastifyRequest, reply: FastifyReply) {
  const { title, description } = createBoardBodySchema.parse(request.body);
  const organizationId = request.user.organizationId;

  if (!organizationId) {
    return reply.status(400).send({ message: 'Organization ID is required' });
  }

  const board = await boardsService.createBoard(organizationId, { title, description });

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
  const { title, description, priority, dueDate, tagIds, budgetId } = createCardBodySchema.parse(
    request.body
  );
  const { columnId } = columnIdParamsSchema.parse(request.params);

  try {
    const card = await boardsService.createCard({
      title,
      description,
      priority,
      dueDate,
      columnId,
      tagIds,
      budgetId,
    });

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
