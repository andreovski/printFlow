import { prisma } from '@/lib/prisma';

export class MetricsRepository {
  async getMetrics(organizationId: string) {
    const [
      totalClients,
      totalProducts,
      totalBudgets,
      approvedBudgets,
      rejectedBudgets,
      sentBudgets,
    ] = await Promise.all([
      prisma.client.count({
        where: {
          organizationId,
          active: true,
        },
      }),
      prisma.product.count({
        where: {
          organizationId,
          active: true,
        },
      }),
      prisma.budget.count({
        where: {
          organizationId,
          deletedAt: null,
          archived: false,
        },
      }),
      prisma.budget.count({
        where: {
          organizationId,
          status: 'ACCEPTED',
          deletedAt: null,
          archived: false,
        },
      }),
      prisma.budget.count({
        where: {
          organizationId,
          status: 'REJECTED',
          deletedAt: null,
          archived: false,
        },
      }),
      prisma.budget.count({
        where: {
          organizationId,
          status: 'SENT',
          deletedAt: null,
          archived: false,
        },
      }),
    ]);

    return {
      totalClients,
      totalProducts,
      totalBudgets,
      approvedBudgets,
      rejectedBudgets,
      sentBudgets,
    };
  }

  async getBudgetsOverTime(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const budgets = await prisma.budget.groupBy({
      by: ['createdAt'],
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
        },
        deletedAt: null,
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day for periods <= 30 days
    const budgetsByDay = budgets.reduce((acc: Record<string, number>, budget) => {
      const day = new Date(budget.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      });
      acc[day] = (acc[day] || 0) + budget._count.id;
      return acc;
    }, {});

    return Object.entries(budgetsByDay).map(([month, count]) => ({
      month,
      count,
    }));
  }

  async getClientsOverTime(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const clients = await prisma.client.groupBy({
      by: ['createdAt'],
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day for periods <= 30 days
    const clientsByDay = clients.reduce((acc: Record<string, number>, client) => {
      const day = new Date(client.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      });
      acc[day] = (acc[day] || 0) + client._count.id;
      return acc;
    }, {});

    return Object.entries(clientsByDay).map(([month, count]) => ({
      month,
      count,
    }));
  }
}
