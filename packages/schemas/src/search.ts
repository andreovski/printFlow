import { z } from 'zod';

export const globalSearchQuerySchema = z.object({
  q: z.string().min(3, 'A busca deve ter no mínimo 3 caracteres'),
  types: z
    .array(z.enum(['budgets', 'cards']))
    .optional()
    .default(['budgets', 'cards']),
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

export const globalSearchResultSchema = z.object({
  budgets: z.array(searchResultBudgetSchema),
  cards: z.array(searchResultCardSchema),
  totalBudgets: z.number().int(),
  totalCards: z.number().int(),
});

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
export type SearchResultBudget = z.infer<typeof searchResultBudgetSchema>;
export type SearchResultCard = z.infer<typeof searchResultCardSchema>;
export type GlobalSearchResult = z.infer<typeof globalSearchResultSchema>;
