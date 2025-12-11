import { prisma } from '@/lib/prisma';

interface SalesMovementFilters {
  organizationId: string;
  startDate: Date;
  endDate: Date;
}

interface SalesMovementKPIs {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
}

interface SalesMovementBudget {
  id: string;
  code: number;
  clientName: string;
  approvedAt: Date | null;
  saleValue: number;
  costValue: number;
  profit: number;
  status: string;
  excludedFromSales: boolean;
}

export class SalesMovementService {
  /**
   * Busca KPIs de vendas (considera todos os registros do período onde excludedFromSales = false)
   */
  async getKPIs(filters: SalesMovementFilters): Promise<SalesMovementKPIs> {
    // Set endDate to end of day (23:59:59.999)
    const endOfDay = new Date(filters.endDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Busca todos os orçamentos ACCEPTED do período que não estão excluídos
    const budgets = await prisma.budget.findMany({
      where: {
        organizationId: filters.organizationId,
        status: 'ACCEPTED',
        excludedFromSales: false,
        deletedAt: null,
        approvedAt: {
          gte: filters.startDate,
          lte: endOfDay,
        },
      },
      select: {
        subtotal: true,
        discountType: true,
        discountValue: true,
        surchargeType: true,
        surchargeValue: true,
        items: {
          select: {
            costPrice: true,
            quantity: true,
          },
        },
      },
    });

    // Calcula os KPIs
    let totalRevenue = 0;
    let totalCost = 0;

    for (const budget of budgets) {
      // O subtotal do BD inclui apenas descontos de itens
      // Precisamos aplicar acréscimo e desconto globais
      let revenue = Number(budget.subtotal);

      // Aplicar acréscimo global primeiro
      const surchargeValue = Number(budget.surchargeValue) || 0;
      if (budget.surchargeType === 'PERCENT' && surchargeValue) {
        revenue += revenue * (surchargeValue / 100);
      } else if (surchargeValue) {
        revenue += surchargeValue;
      }

      // Aplicar desconto global
      const discountValue = Number(budget.discountValue) || 0;
      if (budget.discountType === 'PERCENT' && discountValue) {
        revenue -= revenue * (discountValue / 100);
      } else if (discountValue) {
        revenue -= discountValue;
      }

      totalRevenue += revenue;

      // Soma o custo de todos os itens do orçamento
      for (const item of budget.items) {
        totalCost += Number(item.costPrice) * item.quantity.toNumber();
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin,
    };
  }

  /**
   * Lista orçamentos aprovados no período (paginado)
   */
  async listBudgets(
    filters: SalesMovementFilters,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: SalesMovementBudget[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // Set endDate to end of day (23:59:59.999)
    const endOfDay = new Date(filters.endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where = {
      organizationId: filters.organizationId,
      status: 'ACCEPTED' as const,
      deletedAt: null,
      approvedAt: {
        gte: filters.startDate,
        lte: endOfDay,
      },
    };

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          subtotal: true,
          discountType: true,
          discountValue: true,
          surchargeType: true,
          surchargeValue: true,
          approvedAt: true,
          excludedFromSales: true,
          client: {
            select: {
              name: true,
            },
          },
          items: {
            select: {
              costPrice: true,
              quantity: true,
            },
          },
        },
        orderBy: {
          approvedAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.budget.count({ where }),
    ]);

    // Mapeia para o formato de resposta
    const data: SalesMovementBudget[] = budgets.map((budget) => {
      // O subtotal do BD inclui apenas descontos de itens
      // Precisamos aplicar acréscimo e desconto globais
      let saleValue = Number(budget.subtotal);

      // Aplicar acréscimo global primeiro
      const surchargeValue = Number(budget.surchargeValue) || 0;
      if (budget.surchargeType === 'PERCENT' && surchargeValue) {
        saleValue += saleValue * (surchargeValue / 100);
      } else if (surchargeValue) {
        saleValue += surchargeValue;
      }

      // Aplicar desconto global
      const discountValue = Number(budget.discountValue) || 0;
      if (budget.discountType === 'PERCENT' && discountValue) {
        saleValue -= saleValue * (discountValue / 100);
      } else if (discountValue) {
        saleValue -= discountValue;
      }

      const costValue = budget.items.reduce(
        (sum, item) => sum + Number(item.costPrice) * item.quantity.toNumber(),
        0
      );
      const profit = saleValue - costValue;

      return {
        id: budget.id,
        code: budget.code,
        clientName: budget.client.name,
        approvedAt: budget.approvedAt,
        saleValue,
        costValue,
        profit,
        status: budget.status,
        excludedFromSales: budget.excludedFromSales,
      };
    });

    return { data, total };
  }

  /**
   * Atualiza o campo excludedFromSales de um orçamento
   */
  async toggleExcludeFromSales(id: string, excludedFromSales: boolean) {
    return prisma.budget.update({
      where: { id },
      data: { excludedFromSales },
      select: {
        id: true,
        excludedFromSales: true,
      },
    });
  }
}
