import {
  accountsPayableFiltersSchema,
  createAccountsPayableSchema,
  updateAccountsPayableSchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { AccountsPayableService } from '@/services/accounts-payable.service';

const getAccountsPayableParamsSchema = z.object({
  id: z.string().uuid(),
});

const getDatesWithBillsQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export async function createAccountsPayableController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = createAccountsPayableSchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const service = new AccountsPayableService();

  const result = await service.create({
    ...body,
    organizationId,
  });

  return reply.status(201).send(result);
}

export async function listAccountsPayableController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const filters = accountsPayableFiltersSchema.parse(request.query);

  const service = new AccountsPayableService();

  const accountsPayable = await service.findMany(organizationId, filters);

  return reply.status(200).send({ accountsPayable });
}

export async function getAccountsPayableController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getAccountsPayableParamsSchema.parse(request.params);

  const service = new AccountsPayableService();
  const accountPayable = await service.findById(id);

  if (!accountPayable) {
    return reply.status(404).send({ message: 'Conta a pagar não encontrada' });
  }

  return reply.status(200).send({ accountPayable });
}

const updateAccountsPayableQuerySchema = z.object({
  recalculateNext: z.coerce.boolean().optional().default(false),
});

export async function updateAccountsPayableController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = getAccountsPayableParamsSchema.parse(request.params);
  const body = updateAccountsPayableSchema.parse(request.body);
  const { recalculateNext } = updateAccountsPayableQuerySchema.parse(request.query);

  const service = new AccountsPayableService();

  try {
    const accountPayable = await service.updateWithRecalculation(id, body, recalculateNext);
    return reply.status(200).send({ accountPayable });
  } catch (error) {
    if (error instanceof Error && error.message === 'Conta a pagar não encontrada') {
      return reply.status(404).send({ message: error.message });
    }
    throw error;
  }
}

export async function getDeleteAccountsPayableInfoController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = getAccountsPayableParamsSchema.parse(request.params);

  const service = new AccountsPayableService();

  try {
    const info = await service.getDeleteInfo(id);
    return reply.status(200).send(info);
  } catch (error) {
    if (error instanceof Error && error.message === 'Conta a pagar não encontrada') {
      return reply.status(404).send({ message: error.message });
    }
    throw error;
  }
}

export async function deleteAccountsPayableController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = getAccountsPayableParamsSchema.parse(request.params);

  const service = new AccountsPayableService();

  // Check if exists
  const accountPayable = await service.findById(id);
  if (!accountPayable) {
    return reply.status(404).send({ message: 'Conta a pagar não encontrada' });
  }

  await service.delete(id);

  return reply.status(204).send();
}

export async function getAccountsPayableKPIsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { organizationId } = request.user as { organizationId: string };
  const filters = accountsPayableFiltersSchema.parse(request.query);

  const service = new AccountsPayableService();

  const kpis = await service.getKPIs(organizationId, {
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  return reply.status(200).send({ kpis });
}

export async function getDatesWithBillsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { startDate, endDate } = getDatesWithBillsQuerySchema.parse(request.query);

  const service = new AccountsPayableService();

  const dates = await service.getDatesWithBills(organizationId, startDate, endDate);

  return reply.status(200).send({ dates });
}
