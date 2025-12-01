import {
  createManyAttachmentsBodySchema,
  budgetAttachmentParamsSchema,
  cardAttachmentParamsSchema,
  budgetAttachmentIdParamsSchema,
  cardAttachmentIdParamsSchema,
} from '@magic-system/schemas';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AttachmentsService } from '@/services/attachments.service';

const attachmentsService = new AttachmentsService();

export async function createBudgetAttachmentsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { budgetId } = budgetAttachmentParamsSchema.parse(request.params);
    const { attachments } = createManyAttachmentsBodySchema.parse(request.body);
    const { organizationId } = request.user as { organizationId: string };

    const result = await attachmentsService.createMany({
      attachments,
      organizationId,
      budgetId,
    });

    return reply.status(201).send(result);
  } catch (error) {
    console.error('Error in createBudgetAttachmentsController:', error);
    return reply.status(400).send({ message: 'Bad request' });
  }
}

export async function fetchBudgetAttachmentsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { budgetId } = budgetAttachmentParamsSchema.parse(request.params);

  const attachments = await attachmentsService.findByBudgetId(budgetId);

  return reply.status(200).send({ attachments });
}

export async function deleteBudgetAttachmentController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { attachmentId } = budgetAttachmentIdParamsSchema.parse(request.params);
  const { organizationId } = request.user as { organizationId: string };

  try {
    await attachmentsService.delete(attachmentId, organizationId);
    return reply.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Attachment not found') {
        return reply.status(404).send({ message: 'Anexo não encontrado' });
      }
      if (error.message === 'Attachment does not belong to this organization') {
        return reply.status(403).send({ message: 'Acesso negado' });
      }
    }
    throw error;
  }
}

// ========== CARD ATTACHMENTS ==========

export async function createCardAttachmentsController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { cardId } = cardAttachmentParamsSchema.parse(request.params);
  const { attachments } = createManyAttachmentsBodySchema.parse(request.body);
  const { organizationId } = request.user as { organizationId: string };

  const result = await attachmentsService.createMany({
    attachments,
    organizationId,
    cardId,
  });

  return reply.status(201).send(result);
}

export async function fetchCardAttachmentsController(request: FastifyRequest, reply: FastifyReply) {
  const { cardId } = cardAttachmentParamsSchema.parse(request.params);

  const attachments = await attachmentsService.findByCardId(cardId);

  return reply.status(200).send({ attachments });
}

export async function deleteCardAttachmentController(request: FastifyRequest, reply: FastifyReply) {
  const { attachmentId } = cardAttachmentIdParamsSchema.parse(request.params);
  const { organizationId } = request.user as { organizationId: string };

  try {
    await attachmentsService.delete(attachmentId, organizationId);
    return reply.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Attachment not found') {
        return reply.status(404).send({ message: 'Anexo não encontrado' });
      }
      if (error.message === 'Attachment does not belong to this organization') {
        return reply.status(403).send({ message: 'Acesso negado' });
      }
    }
    throw error;
  }
}
