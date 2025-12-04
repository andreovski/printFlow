import { FastifyReply, FastifyRequest } from 'fastify';

import { MetricsRepository } from '@/repositories/metrics.repository';

export async function getMetricsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { period = '30' } = request.query as { period?: string };

  if (!organizationId) {
    return reply.status(400).send({ message: 'Organization required' });
  }

  const periodDays = parseInt(period, 10);
  if (![7, 15, 30].includes(periodDays)) {
    return reply.status(400).send({ message: 'Invalid period. Must be 7, 15, or 30' });
  }

  const metricsRepository = new MetricsRepository();

  const [metrics, budgetsOverTime, clientsOverTime] = await Promise.all([
    metricsRepository.getMetrics(organizationId),
    metricsRepository.getBudgetsOverTime(organizationId, periodDays),
    metricsRepository.getClientsOverTime(organizationId, periodDays),
  ]);

  return reply.status(200).send({
    metrics: {
      ...metrics,
      budgetsOverTime,
      clientsOverTime,
    },
  });
}
