import {
  accountsPayableFiltersSchema,
  createAccountsPayableSchema,
  updateAccountsPayableSchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { AccountsPayableService } from '@/services/accounts-payable.service';
import { RecurringJobService } from '@/services/recurring-job.service';

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
  const { organizationId, sub: userId } = request.user as { organizationId: string; sub: string };

  // Se for recorrente, usar o RecurringJobService
  if (body.isRecurring) {
    const recurringService = new RecurringJobService();
    const parent = await recurringService.createRecurringAccounts({
      ...body,
      organizationId,
      userId,
    });

    // Retornar apenas o parent (primeira conta), o job criará as outras 59
    return reply.status(201).send({
      accountsPayable: [parent],
      count: 1,
      message: '60 contas recorrentes estão sendo criadas em segundo plano',
    });
  }

  // Criar conta normal (ou parcelada)
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
  applyToFuture: z.coerce.boolean().optional().default(false),
});

export async function updateAccountsPayableController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = getAccountsPayableParamsSchema.parse(request.params);
  const body = updateAccountsPayableSchema.parse(request.body);
  const { recalculateNext, applyToFuture } = updateAccountsPayableQuerySchema.parse(request.query);

  // Verificar se é conta recorrente
  const service = new AccountsPayableService();
  const existing = await service.findById(id);

  if (!existing) {
    return reply.status(404).send({ message: 'Conta a pagar não encontrada' });
  }

  // Se for recorrente e applyToFuture = true, usar RecurringJobService
  if (existing.isRecurring && applyToFuture) {
    const recurringService = new RecurringJobService();
    try {
      const { sub: userId } = request.user as { sub: string };
      const accountPayable = await recurringService.updateRecurring(id, { ...body, userId }, true);
      return reply.status(200).send({ accountPayable });
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ message: error.message });
      }
      throw error;
    }
  }

  // Atualizar normalmente (com ou sem recálculo de parcelas)
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
  const querySchema = z.object({
    deleteAllFuture: z.coerce.boolean().optional().default(false),
  });
  const { deleteAllFuture } = querySchema.parse(request.query);

  const service = new AccountsPayableService();

  // Check if exists
  const accountPayable = await service.findById(id);
  if (!accountPayable) {
    return reply.status(404).send({ message: 'Conta a pagar não encontrada' });
  }

  // Se for recorrente e deleteAllFuture = true, usar RecurringJobService
  if (accountPayable.isRecurring && deleteAllFuture) {
    const recurringService = new RecurringJobService();
    try {
      await recurringService.deleteRecurring(id, true);
      return reply.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ message: error.message });
      }
      throw error;
    }
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

export async function getRecurringDeleteInfoController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = getAccountsPayableParamsSchema.parse(request.params);

  const service = new AccountsPayableService();
  const accountPayable = await service.findById(id);

  if (!accountPayable) {
    return reply.status(404).send({ message: 'Conta a pagar não encontrada' });
  }

  if (!accountPayable.isRecurring) {
    return reply.status(200).send({
      isRecurring: false,
      hasFuture: false,
      futureCount: 0,
    });
  }

  // Buscar informações da série recorrente
  const recurringService = new RecurringJobService();
  try {
    const parent = await recurringService['getRecurringInfo'](id);

    return reply.status(200).send({
      isRecurring: true,
      hasFuture: parent.futureCount > 0,
      futureCount: parent.futureCount,
      position: accountPayable.recurringPosition,
      totalInSeries: 60,
    });
  } catch (error) {
    return reply.status(400).send({ message: 'Erro ao buscar informações de recorrência' });
  }
}
