import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { OrganizationRepository } from '@/repositories/organization.repository';

export async function getOrganizationController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };

  if (!organizationId) {
    return reply.status(404).send({ message: 'Organization not found' });
  }

  const organizationRepository = new OrganizationRepository();

  try {
    const organization = await organizationRepository.getOrganizationById(organizationId);
    return reply.status(200).send({ organization });
  } catch (err) {
    if (err instanceof Error && err.message === 'Organization not found') {
      return reply.status(404).send({ message: 'Organization not found' });
    }
    throw err;
  }
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
    logoUrl: z.string().optional(),
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

export async function createOrganizationController(request: FastifyRequest, reply: FastifyReply) {
  const { createOrganizationBodySchema } = await import('@magic-system/schemas');
  const { sub: userId } = request.user as { sub: string };
  const data = createOrganizationBodySchema.parse(request.body);

  const { OrganizationService } = await import('@/services/organization.service');
  const { UsersRepository } = await import('@/repositories/users.repository');

  const organizationRepository = new OrganizationRepository();
  const usersRepository = new UsersRepository();
  const organizationService = new OrganizationService(organizationRepository, usersRepository);

  try {
    const { organization } = await organizationService.createOrganization(userId, data);

    // Generate new token with organizationId
    const token = await reply.jwtSign(
      {
        role: 'MASTER', // User becomes MASTER of the new organization
        organizationId: organization.id,
      },
      {
        sign: {
          sub: userId,
        },
      }
    );

    return reply.status(201).send({ organization, token });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'User not found.') {
        return reply.status(404).send({ message: 'Usuário não encontrado.' });
      }
      if (err.message === 'User already has an organization.') {
        return reply.status(400).send({ message: 'Usuário já possui uma organização.' });
      }
    }
    return reply.status(400).send({ message: 'Erro ao criar organização.' });
  }
}
