import {
  createTemplateBodySchema,
  getTemplateParamsSchema,
  updateTemplateParamsSchema,
  updateTemplateBodySchema,
  deleteTemplateParamsSchema,
  listTemplatesQuerySchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { TemplatesRepository } from '@/repositories/templates.repository';

export async function createTemplateController(request: FastifyRequest, reply: FastifyReply) {
  const { name, content, scope } = createTemplateBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const templatesRepository = new TemplatesRepository();

  // Verificar se já existe um template com o mesmo nome na organização (case insensitive)
  const existingTemplate = await templatesRepository.findByNameAndOrganization(
    name,
    organizationId
  );
  if (existingTemplate) {
    return reply.status(409).send({ message: 'Já existe um template com este nome' });
  }

  const template = await templatesRepository.create({
    name,
    content,
    scope,
    organization: {
      connect: { id: organizationId },
    },
  });

  return reply.status(201).send({ template });
}

export async function fetchTemplatesController(request: FastifyRequest, reply: FastifyReply) {
  const { organizationId } = request.user as { organizationId: string };
  const { page, pageSize, search, scope, active } = listTemplatesQuerySchema.parse(request.query);

  const templatesRepository = new TemplatesRepository();

  const { data, total } = await templatesRepository.findMany({
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

export async function getTemplateController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = getTemplateParamsSchema.parse(request.params);
  const { organizationId } = request.user as { organizationId: string };

  const templatesRepository = new TemplatesRepository();

  const template = await templatesRepository.findById(id);

  if (!template) {
    return reply.status(404).send({ message: 'Template não encontrado' });
  }

  if (template.organizationId !== organizationId) {
    return reply.status(403).send({ message: 'Acesso negado' });
  }

  return reply.status(200).send({ template });
}

export async function updateTemplateController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = updateTemplateParamsSchema.parse(request.params);
  const { name, content, scope, active } = updateTemplateBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const templatesRepository = new TemplatesRepository();

  const existingTemplate = await templatesRepository.findById(id);

  if (!existingTemplate) {
    return reply.status(404).send({ message: 'Template não encontrado' });
  }

  if (existingTemplate.organizationId !== organizationId) {
    return reply.status(403).send({ message: 'Acesso negado' });
  }

  // Se o nome está sendo alterado, verificar unicidade
  if (name && name.toLowerCase() !== existingTemplate.name.toLowerCase()) {
    const duplicateTemplate = await templatesRepository.findByNameAndOrganization(
      name,
      organizationId
    );
    if (duplicateTemplate && duplicateTemplate.id !== id) {
      return reply.status(409).send({ message: 'Já existe um template com este nome' });
    }
  }

  const template = await templatesRepository.update(id, {
    name,
    content,
    scope,
    active,
  });

  return reply.status(200).send({ template });
}

export async function deleteTemplateController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = deleteTemplateParamsSchema.parse(request.params);
  const { organizationId } = request.user as { organizationId: string };

  const templatesRepository = new TemplatesRepository();

  const existingTemplate = await templatesRepository.findById(id);

  if (!existingTemplate) {
    return reply.status(404).send({ message: 'Template não encontrado' });
  }

  if (existingTemplate.organizationId !== organizationId) {
    return reply.status(403).send({ message: 'Acesso negado' });
  }

  // Soft delete: marca como inativo
  await templatesRepository.softDelete(id);

  return reply.status(204).send();
}
