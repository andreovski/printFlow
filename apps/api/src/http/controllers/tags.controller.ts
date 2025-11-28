import {
  createTagBodySchema,
  getTagParamsSchema,
  updateTagParamsSchema,
  updateTagBodySchema,
  deleteTagParamsSchema,
  listTagsQuerySchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { TagsRepository } from '@/repositories/tags.repository';

export async function createTagController(request: FastifyRequest, reply: FastifyReply) {
  const { name, color, scope } = createTagBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const tagsRepository = new TagsRepository();

  // Verificar se já existe uma tag com o mesmo nome na organização (case insensitive)
  const existingTag = await tagsRepository.findByNameAndOrganization(name, organizationId);
  if (existingTag) {
    return reply.status(409).send({ message: 'Já existe uma tag com este nome' });
  }

  const tag = await tagsRepository.create({
    name,
    color,
    scope,
    organization: {
      connect: { id: organizationId },
    },
  });

  return reply.status(201).send({ tag });
}

export async function fetchTagsController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { page, pageSize, search, scope, active } = listTagsQuerySchema.parse(request.query);

  const tagsRepository = new TagsRepository();

  const { data, total } = await tagsRepository.findMany({
    organizationId,
    page,
    pageSize,
    search,
    scope,
    active,
  });

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

export async function getTagController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getTagParamsSchema.parse(request.params);
  const { organizationId } = request.user as { organizationId: string };

  const tagsRepository = new TagsRepository();

  const tag = await tagsRepository.findById(id);

  if (!tag) {
    return reply.status(404).send({ message: 'Tag não encontrada' });
  }

  // Verificar se a tag pertence à organização do usuário
  if (tag.organizationId !== organizationId) {
    return reply.status(403).send({ message: 'Acesso negado' });
  }

  return reply.status(200).send({ tag });
}

export async function updateTagController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = updateTagParamsSchema.parse(request.params);
  const { name, color, scope, active } = updateTagBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const tagsRepository = new TagsRepository();

  const existingTag = await tagsRepository.findById(id);

  if (!existingTag) {
    return reply.status(404).send({ message: 'Tag não encontrada' });
  }

  // Verificar se a tag pertence à organização do usuário
  if (existingTag.organizationId !== organizationId) {
    return reply.status(403).send({ message: 'Acesso negado' });
  }

  // Se o nome está sendo alterado, verificar unicidade
  if (name && name.toLowerCase() !== existingTag.name.toLowerCase()) {
    const duplicateTag = await tagsRepository.findByNameAndOrganization(name, organizationId);
    if (duplicateTag && duplicateTag.id !== id) {
      return reply.status(409).send({ message: 'Já existe uma tag com este nome' });
    }
  }

  const tag = await tagsRepository.update(id, {
    name,
    color,
    scope,
    active,
  });

  return reply.status(200).send({ tag });
}

export async function deleteTagController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = deleteTagParamsSchema.parse(request.params);
  const { organizationId } = request.user as { organizationId: string };

  const tagsRepository = new TagsRepository();

  const existingTag = await tagsRepository.findById(id);

  if (!existingTag) {
    return reply.status(404).send({ message: 'Tag não encontrada' });
  }

  // Verificar se a tag pertence à organização do usuário
  if (existingTag.organizationId !== organizationId) {
    return reply.status(403).send({ message: 'Acesso negado' });
  }

  // Soft delete: marca como inativo
  await tagsRepository.softDelete(id);

  return reply.status(204).send();
}
