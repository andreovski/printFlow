import { FastifyReply, FastifyRequest } from 'fastify';

import { MetricsRepository } from '@/repositories/metrics.repository';

export async function getMetricsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };

  if (!organizationId) {
    return reply.status(400).send({ message: 'Organization required' });
  }

  const metricsRepository = new MetricsRepository();

  const metrics = await metricsRepository.getMetrics(organizationId);

  return reply.status(200).send({ metrics });
}
