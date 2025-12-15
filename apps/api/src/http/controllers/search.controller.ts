import { globalSearchQuerySchema } from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { GlobalSearchService } from '@/services/global-search.service';

export async function globalSearchController(request: FastifyRequest, reply: FastifyReply) {
  const { q, types, limit } = globalSearchQuerySchema.parse(request.query);
  const { organizationId } = request.user as { organizationId: string };

  const searchService = new GlobalSearchService();

  const results = await searchService.search({
    query: q,
    organizationId,
    types,
    limit,
  });

  await searchService.disconnect();

  return reply.status(200).send(results);
}
