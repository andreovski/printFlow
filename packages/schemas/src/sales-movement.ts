import { z } from 'zod';

// Query schema para filtro de período
export const salesMovementQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().optional().default(20),
});

// Schema para toggle de exclusão
export const toggleExcludeFromSalesBodySchema = z.object({
  excludedFromSales: z.boolean(),
});

export const toggleExcludeFromSalesParamsSchema = z.object({
  id: z.string().uuid(),
});

export type SalesMovementQuery = z.infer<typeof salesMovementQuerySchema>;
export type ToggleExcludeFromSalesBody = z.infer<typeof toggleExcludeFromSalesBodySchema>;
export type ToggleExcludeFromSalesParams = z.infer<typeof toggleExcludeFromSalesParamsSchema>;

// Response types
export interface SalesMovementKPIs {
  totalRevenue: number; // Faturamento Total (soma preço de venda)
  totalCost: number; // Custo Total (soma preço de custo)
  grossProfit: number; // Lucro Bruto (faturamento - custo)
  profitMargin: number; // Margem % ((lucro/faturamento) * 100)
}

export interface SalesMovementBudget {
  id: string;
  code: number;
  clientName: string;
  approvedAt: Date | null;
  saleValue: number; // Preço de venda total do orçamento
  costValue: number; // Preço de custo total do orçamento
  profit: number; // Lucro individual do orçamento
  status: string;
  excludedFromSales: boolean;
}

export interface SalesMovementListResponse {
  data: SalesMovementBudget[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SalesMovementKPIsResponse {
  kpis: SalesMovementKPIs;
}
