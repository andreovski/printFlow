import { z } from 'zod';

// Enum para escopo da tag
export const TagScopeEnum = z.enum(['GLOBAL', 'BUDGET', 'PRODUCTION']);
export type TagScope = z.infer<typeof TagScopeEnum>;

// Regex para validar cor HEX
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Schema para criar tag
export const createTagBodySchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  color: z
    .string({ required_error: 'Cor é obrigatória' })
    .regex(hexColorRegex, 'Cor deve estar no formato HEX (ex: #FF5733)'),
  scope: TagScopeEnum.default('GLOBAL'),
});

// Schema para parâmetros de rota
export const getTagParamsSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const updateTagParamsSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export const deleteTagParamsSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

// Schema para atualização
export const updateTagBodySchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .optional(),
  color: z.string().regex(hexColorRegex, 'Cor deve estar no formato HEX (ex: #FF5733)').optional(),
  scope: TagScopeEnum.optional(),
  active: z.boolean().optional(),
});

// Schema para query de listagem
export const listTagsQuerySchema = z.object({
  scope: TagScopeEnum.optional(),
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

// Tipos inferidos dos schemas
export type CreateTagBody = z.infer<typeof createTagBodySchema>;
export type GetTagParams = z.infer<typeof getTagParamsSchema>;
export type UpdateTagParams = z.infer<typeof updateTagParamsSchema>;
export type DeleteTagParams = z.infer<typeof deleteTagParamsSchema>;
export type UpdateTagBody = z.infer<typeof updateTagBodySchema>;
export type ListTagsQuery = z.infer<typeof listTagsQuerySchema>;

// Entity type
export interface Tag {
  id: string;
  name: string;
  color: string;
  scope: TagScope;
  active: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Response types
export interface CreateTagResponse {
  tag: Tag;
}

export interface GetTagResponse {
  tag: Tag;
}

export interface UpdateTagResponse {
  tag: Tag;
}

export interface ListTagsResponse {
  data: Tag[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
