import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

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

export async function updateOrganizationController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };

  const updateOrganizationBodySchema = z.object({
    budgetAutoInactive: z.boolean().optional(),
    budgetAutoArchive: z.boolean().optional(),
    budgetShowTotalInKanban: z.boolean().optional(),
    // Company Information
    cnpj: z.string().optional(),
    enterpriseName: z.string().optional(),
    fantasyName: z.string().optional(),
    mainEmail: z.string().email().optional(),
    mainPhone: z.string().optional(),
    // Address
    cep: z.string().optional(),
    address: z.string().optional(),
    addressNumber: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  });

  const data = updateOrganizationBodySchema.parse(request.body);

  const organizationRepository = new OrganizationRepository();
  const organization = await organizationRepository.update(organizationId, data);

  return reply.status(200).send({ organization });
}
