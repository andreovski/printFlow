import {
  salesMovementQuerySchema,
  toggleExcludeFromSalesBodySchema,
  toggleExcludeFromSalesParamsSchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { SalesMovementService } from '@/services/sales-movement.service';

/**
 * Retorna os KPIs de vendas para o período especificado
 * KPIs: Faturamento Total, Custo Total, Lucro Bruto, Margem %
 */
export async function getSalesMovementKPIsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { startDate, endDate } = salesMovementQuerySchema.parse(request.query);

  const salesMovementService = new SalesMovementService();

  const kpis = await salesMovementService.getKPIs({
    organizationId,
    startDate,
    endDate,
  });

  return reply.status(200).send({ kpis });
}

/**
 * Lista orçamentos aprovados no período (paginado)
 */
export async function listSalesMovementController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { startDate, endDate, page, pageSize } = salesMovementQuerySchema.parse(request.query);

  const salesMovementService = new SalesMovementService();

  const { data, total } = await salesMovementService.listBudgets(
    {
      organizationId,
      startDate,
      endDate,
    },
    page,
    pageSize
  );

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

/**
 * Atualiza o campo excludedFromSales de um orçamento
 */
export async function toggleExcludeFromSalesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = toggleExcludeFromSalesParamsSchema.parse(request.params);
  const { excludedFromSales } = toggleExcludeFromSalesBodySchema.parse(request.body);

  const salesMovementService = new SalesMovementService();

  const result = await salesMovementService.toggleExcludeFromSales(id, excludedFromSales);

  return reply.status(200).send(result);
}
