import { z } from 'zod';

export const globalSearchQuerySchema = z.object({
  q: z.string().min(3, 'A busca deve ter no mínimo 3 caracteres'),
  types: z
    .array(z.enum(['budgets', 'cards', 'clients', 'products']))
    .optional()
    .default(['budgets', 'cards', 'clients', 'products']),
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
});

export const searchResultBudgetSchema = z.object({
  id: z.string().uuid(),
  code: z.number().int(),
  status: z.string(),
  total: z.number(),
  createdAt: z.date(),
  client: z.object({
    name: z.string(),
    phone: z.string(),
  }),
  rank: z.number(),
});

export const searchResultCardSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.string().nullable(),
  dueDate: z.date().nullable(),
  column: z.object({
    title: z.string(),
    board: z.object({
      title: z.string(),
    }),
  }),
  rank: z.number(),
});

export const searchResultClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  document: z.string(),
  active: z.boolean(),
  rank: z.number(),
});

export const searchResultProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  code: z.string().nullable(),
  costPrice: z.number(),
  salePrice: z.number(),
  stock: z.number().int(),
  active: z.boolean(),
  rank: z.number(),
});

export const globalSearchResultSchema = z.object({
  budgets: z.array(searchResultBudgetSchema),
  cards: z.array(searchResultCardSchema),
  clients: z.array(searchResultClientSchema),
  products: z.array(searchResultProductSchema),
  totalBudgets: z.number().int(),
  totalCards: z.number().int(),
  totalClients: z.number().int(),
  totalProducts: z.number().int(),
});

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
export type SearchResultBudget = z.infer<typeof searchResultBudgetSchema>;
export type SearchResultCard = z.infer<typeof searchResultCardSchema>;
export type SearchResultClient = z.infer<typeof searchResultClientSchema>;
export type SearchResultProduct = z.infer<typeof searchResultProductSchema>;
export type GlobalSearchResult = z.infer<typeof globalSearchResultSchema>;
