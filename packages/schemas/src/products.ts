import { z } from 'zod';

export const createProductBodySchema = z.object({
  name: z.string(),
  price: z.coerce.number(),
});

export const getProductParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateProductParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateProductBodySchema = z.object({
  name: z.string().optional(),
  price: z.coerce.number().optional(),
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type GetProductParams = z.infer<typeof getProductParamsSchema>;
export type UpdateProductParams = z.infer<typeof updateProductParamsSchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
