import { FastifyReply, FastifyRequest } from 'fastify';

import { OrganizationRepository } from '@/repositories/organization.repository';

export async function getOrganizationController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };

  const organizationRepository = new OrganizationRepository();
  const organization = await organizationRepository.getOrganizationById(organizationId);

  if (!organization) {
    return reply.status(404).send({ message: 'Organization not found' });
  }

  return reply.status(200).send({ organization });
}
