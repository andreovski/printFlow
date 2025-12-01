import {
  createClientBodySchema,
  getClientParamsSchema,
  updateClientParamsSchema,
  updateClientBodySchema,
  paginationQuerySchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { ClientsRepository } from '@/repositories/clients.repository';

export async function createClientController(request: FastifyRequest, reply: FastifyReply) {
  const data = createClientBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const clientsRepository = new ClientsRepository();
  const clientExists = await clientsRepository.findByCpf(data.document, organizationId);

  if (clientExists) {
    return reply.status(400).send({ message: 'Já existe um cliente com essas informações.' });
  }

  const client = await clientsRepository.create({
    ...data,
    organization: {
      connect: { id: organizationId },
    },
  });

  return reply.status(201).send({ client });
}

export async function fetchClientsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { page, pageSize, search } = paginationQuerySchema.parse(request.query);

  const clientsRepository = new ClientsRepository();

  const { data, total } = await clientsRepository.findMany(organizationId, page, pageSize, search);

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

export async function getClientController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getClientParamsSchema.parse(request.params);

  const clientsRepository = new ClientsRepository();
  const client = await clientsRepository.findById(id);

  if (!client) {
    return reply.status(404).send({ message: 'Client not found' });
  }

  return reply.status(200).send({ client });
}

export async function updateClientController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = updateClientParamsSchema.parse(request.params);
  const {
    name,
    fantasyName,
    email,
    personType,
    document,
    stateRegistration,
    phone,
    isWhatsapp,
    rg,
    cep,
    addressType,
    address,
    addressNumber,
    complement,
    neighborhood,
    city,
    state,
    country,
    notes,
    active,
  } = updateClientBodySchema.parse(request.body);

  const clientsRepository = new ClientsRepository();

  const client = await clientsRepository.update(id, {
    name,
    fantasyName,
    email,
    personType,
    document,
    stateRegistration,
    phone,
    isWhatsapp,
    rg,
    cep,
    addressType,
    address,
    addressNumber,
    complement,
    neighborhood,
    city,
    state,
    country,
    notes,
    active,
  });

  return reply.status(200).send({ client });
}

export async function deleteClientController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getClientParamsSchema.parse(request.params);
  const clientsRepository = new ClientsRepository();
  await clientsRepository.delete(id);
  return reply.status(204).send();
}
