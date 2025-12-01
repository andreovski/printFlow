import { z } from 'zod';

export const createProductBodySchema = z.object({
  title: z.string({ required_error: 'Título é obrigatório' }).min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  code: z.string().optional(),
  ncm: z.coerce.number().optional(),
  unitType: z.enum(['m2', 'unidade'], {
    required_error: 'Tipo de unidade é obrigatório',
  }),
  costPrice: z.coerce.number({ required_error: 'Preço de custo é obrigatório' }),
  salePrice: z.coerce.number({ required_error: 'Preço de venda é obrigatório' }),
  stock: z.coerce.number({ required_error: 'Estoque é obrigatório' }),
  category: z.array(z.string()).optional(),
  active: z.boolean().default(true),
  organizationId: z.string().optional(), // Will be handled by backend usually, but keeping optional here
});

export const getProductParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateProductParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateProductBodySchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').optional(),
  description: z.string().optional(),
  code: z.string().optional(),
  ncm: z.coerce.number().optional(),
  unitType: z.enum(['m2', 'unidade']).optional(),
  costPrice: z.coerce.number().optional(),
  salePrice: z.coerce.number().optional(),
  stock: z.coerce.number().optional(),
  category: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  organizationId: z.string().optional(),
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type GetProductParams = z.infer<typeof getProductParamsSchema>;
export type UpdateProductParams = z.infer<typeof updateProductParamsSchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;

// Entity type
export interface Product {
  id: string;
  title: string;
  description: string | null;
  code: string | null;
  ncm: number | null;
  unitType: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  category: string[];
  active: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Response types
export interface CreateProductResponse {
  product: Product;
}

export interface GetProductResponse {
  product: Product;
}

export interface UpdateProductResponse {
  product: Product;
}
