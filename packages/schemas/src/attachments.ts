import { z } from 'zod';

// Criar attachment
export const createAttachmentBodySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  url: z.string().url('URL inválida'),
  key: z.string().min(1, 'Key é obrigatória'),
  size: z.number().int().positive('Tamanho deve ser um número positivo'),
  mimeType: z.string().nullable().optional(),
});

// Criar múltiplos attachments
export const createManyAttachmentsBodySchema = z.object({
  attachments: z.array(createAttachmentBodySchema).min(1, 'É necessário pelo menos um anexo'),
});

// Params para operações em budget
export const budgetAttachmentParamsSchema = z.object({
  budgetId: z.string().uuid('ID do orçamento inválido'),
});

// Params para operações em card
export const cardAttachmentParamsSchema = z.object({
  cardId: z.string().uuid('ID do card inválido'),
});

// Params para operações em attachment específico
export const attachmentParamsSchema = z.object({
  id: z.string().uuid('ID do anexo inválido'),
});

// Params combinados para budget + attachment
export const budgetAttachmentIdParamsSchema = z.object({
  budgetId: z.string().uuid('ID do orçamento inválido'),
  attachmentId: z.string().uuid('ID do anexo inválido'),
});

// Params combinados para card + attachment
export const cardAttachmentIdParamsSchema = z.object({
  cardId: z.string().uuid('ID do card inválido'),
  attachmentId: z.string().uuid('ID do anexo inválido'),
});

// Tipos exportados
export type CreateAttachmentBody = z.infer<typeof createAttachmentBodySchema>;
export type CreateManyAttachmentsBody = z.infer<typeof createManyAttachmentsBodySchema>;
