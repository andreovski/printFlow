import {
  createBudgetBodySchema,
  getBudgetParamsSchema,
  paginationQuerySchema,
  updateBudgetBodySchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { BudgetsService } from '@/services/budgets.service';

export async function createBudgetController(request: FastifyRequest, reply: FastifyReply) {
  const body = createBudgetBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const budgetsService = new BudgetsService();

  const budget = await budgetsService.create({
    ...body,
    tagIds: body.tagIds || [],
    organizationId,
  });

  return reply.status(201).send({ budget });
}

export async function fetchBudgetsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { page, pageSize } = paginationQuerySchema.parse(request.query);

  const budgetsService = new BudgetsService();

  const { data, total } = await budgetsService.findMany(organizationId, page, pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return reply.status(200).send({
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
}

export async function fetchArchivedBudgetsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { page, pageSize } = paginationQuerySchema.parse(request.query);

  const budgetsService = new BudgetsService();

  const { data, total } = await budgetsService.findArchived(organizationId, page, pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return reply.status(200).send({
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages,
    },
  });
}

export async function getBudgetController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getBudgetParamsSchema.parse(request.params);
  const budgetsService = new BudgetsService();
  const budget = await budgetsService.findById(id);

  if (!budget) {
    return reply.status(404).send({ message: 'Budget not found' });
  }

  return reply.status(200).send({ budget });
}

export async function updateBudgetController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getBudgetParamsSchema.parse(request.params);
  const body = updateBudgetBodySchema.parse(request.body);

  const budgetsService = new BudgetsService();

  const existingBudget = await budgetsService.findById(id);
  if (!existingBudget) {
    return reply.status(404).send({ message: 'Budget not found' });
  }

  // Logic to allow status change to DRAFT (Reopen) or editing only if DRAFT/REJECTED
  if (body.status === undefined) {
    if (existingBudget.status !== 'DRAFT' && existingBudget.status !== 'REJECTED') {
      return reply
        .status(400)
        .send({ message: 'Cannot edit budget that is not DRAFT or REJECTED' });
    }
  }

  const budget = await budgetsService.update(id, {
    ...body,
    tagIds: body.tagIds || [],
  });
  return reply.status(200).send({ budget });
}

export async function updateBudgetStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getBudgetParamsSchema.parse(request.params);
  const { status } = updateBudgetBodySchema.parse(request.body);

  if (!status) {
    return reply.status(400).send({ message: 'Status is required' });
  }

  const budgetsService = new BudgetsService();

  const existingBudget = await budgetsService.findById(id);
  if (!existingBudget) {
    return reply.status(404).send({ message: 'Budget not found' });
  }

  const budget = await budgetsService.updateStatus(id, status);
  return reply.status(200).send({ budget });
}

export async function deleteBudgetController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getBudgetParamsSchema.parse(request.params);
  const budgetsService = new BudgetsService();
  await budgetsService.delete(id);
  return reply.status(204).send();
}

export async function archiveBudgetController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getBudgetParamsSchema.parse(request.params);
  const budgetsService = new BudgetsService();
  await budgetsService.archive(id);
  return reply.status(204).send();
}
