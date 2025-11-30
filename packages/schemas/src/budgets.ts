import { z } from 'zod';
import { Client } from './clients';
import { Tag } from './tags';

export const budgetStatusSchema = z.enum(['DRAFT', 'SENT', 'REJECTED', 'ACCEPTED', 'INACTIVE']);

export const discountTypeSchema = z.enum(['PERCENT', 'VALUE']);

export const budgetItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  discountType: discountTypeSchema.optional().nullable(),
  discountValue: z.coerce.number().nonnegative().optional().nullable(),
});

export const createBudgetBodySchema = z.object({
  clientId: z.string().uuid(),
  expirationDate: z.coerce.date().optional().nullable(),
  discountType: discountTypeSchema.optional().nullable(),
  discountValue: z.coerce.number().nonnegative().optional().nullable(),
  advancePayment: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().nullable(),
  items: z.array(budgetItemSchema).min(1),
});

export const updateBudgetBodySchema = createBudgetBodySchema.partial().extend({
  status: budgetStatusSchema.optional(),
  archived: z.boolean().optional(),
});

export const getBudgetParamsSchema = z.object({
  id: z.string().uuid(),
});

export const budgetStatusLabel: Record<BudgetStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviado',
  REJECTED: 'Rejeitado',
  ACCEPTED: 'Aprovado',
  INACTIVE: 'Inativo',
};

export const budgetStatusColors: Record<BudgetStatus, string> = {
  DRAFT: '#6B7280',
  SENT: '#3B82F6',
  REJECTED: '#EF4444',
  ACCEPTED: '#10B981',
  INACTIVE: '#f0b100',
};

export type BudgetStatus = z.infer<typeof budgetStatusSchema>;
export type DiscountType = z.infer<typeof discountTypeSchema>;
export type BudgetItem = z.infer<typeof budgetItemSchema>;
export type CreateBudgetBody = z.infer<typeof createBudgetBodySchema>;
export type UpdateBudgetBody = z.infer<typeof updateBudgetBodySchema>;
export type GetBudgetParams = z.infer<typeof getBudgetParamsSchema>;

// Schema para listagem de orçamentos aprovados (para vínculo com card)
export const approvedBudgetOptionsQuerySchema = z.object({
  search: z.string().optional(),
});

export type ApprovedBudgetOptionsQuery = z.infer<typeof approvedBudgetOptionsQuerySchema>;

// Entity types
export interface BudgetItemEntity {
  id: string;
  budgetId: string;
  productId: string;
  name: string;
  costPrice: number;
  quantity: number;
  salePrice: number;
  discountType: DiscountType | null;
  discountValue: number | null;
  total: number;
}

export interface Budget {
  id: string;
  code: number;
  organizationId: string;
  clientId: string;
  client: Client;
  status: BudgetStatus;
  expirationDate: Date | null;
  discountType: DiscountType | null;
  discountValue: number | null;
  advancePayment: number | null;
  subtotal: number;
  total: number;
  notes: string | null;
  tags: Tag[];
  items: BudgetItemEntity[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  archived: boolean;
}

// Response types
export interface CreateBudgetResponse {
  budget: Budget;
}

export interface GetBudgetResponse {
  budget: Budget;
}

export interface UpdateBudgetResponse {
  budget: Budget;
}

// Interface para opções de orçamentos aprovados (select no card)
export interface ApprovedBudgetOption {
  id: string;
  code: number;
  total: number;
  notes: string | null;
  client: {
    name: string;
    phone: string;
  };
  tags: Tag[];
}

export interface ApprovedBudgetOptionsResponse {
  data: ApprovedBudgetOption[];
}
