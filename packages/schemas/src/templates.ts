import { z } from 'zod';

// Enum for Template Scope
export const TemplateScopeEnum = z.enum(['GLOBAL', 'BOARD', 'BUDGET']);
export type TemplateScope = z.infer<typeof TemplateScopeEnum>;

// Schema for creating a template
export const createTemplateBodySchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  content: z.string({ required_error: 'Conteúdo é obrigatório' }).min(1, 'Conteúdo é obrigatório'),
  scope: TemplateScopeEnum,
});

// Schema for route params
export const getTemplateParamsSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export const updateTemplateParamsSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export const deleteTemplateParamsSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

// Schema for updating a template
export const updateTemplateBodySchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  content: z.string().min(1, 'Conteúdo é obrigatório').optional(),
  scope: TemplateScopeEnum.optional(),
  active: z.boolean().optional(),
});

// Schema for listing templates
export const listTemplatesQuerySchema = z.object({
  scope: TemplateScopeEnum.optional(),
  active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
});

// Inferred Types
export type CreateTemplateBody = z.infer<typeof createTemplateBodySchema>;
export type GetTemplateParams = z.infer<typeof getTemplateParamsSchema>;
export type UpdateTemplateParams = z.infer<typeof updateTemplateParamsSchema>;
export type DeleteTemplateParams = z.infer<typeof deleteTemplateParamsSchema>;
export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>;
export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;

// Entity Type
export interface Template {
  id: string;
  name: string;
  content: string;
  scope: TemplateScope;
  active: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Response Types
export interface CreateTemplateResponse {
  template: Template;
}

export interface GetTemplateResponse {
  template: Template;
}

export interface UpdateTemplateResponse {
  template: Template;
}

export interface ListTemplatesResponse {
  data: Template[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
