import { addDays, startOfDay, endOfDay, isSameDay } from 'date-fns';

import { prisma } from '@/lib/prisma';

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  date: string;
  route?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  route?: string;
  createdAt: Date;
}

export class NotificationsService {
  /**
   * Busca todas as notificações para a organização
   */
  async getNotifications(organizationId: string, userRole: string): Promise<Notification[]> {
    const today = new Date();
    const tomorrow = addDays(today, 1);

    // Notificações de contas a pagar são apenas para ADMIN e MASTER
    const shouldIncludeAccountsPayable = userRole === 'ADMIN' || userRole === 'MASTER';

    const [budgetNotifications, boardNotifications, accountsPayableNotifications] =
      await Promise.all([
        this.getBudgetNotifications(organizationId, today, tomorrow),
        this.getBoardNotifications(organizationId, today, tomorrow),
        shouldIncludeAccountsPayable
          ? this.getAccountsPayableNotifications(organizationId, today, tomorrow)
          : Promise.resolve([]),
      ]);

    const allNotifications: NotificationItem[] = [
      ...budgetNotifications,
      ...boardNotifications,
      ...accountsPayableNotifications,
    ];

    // Ordenar por prioridade (warning > error > success > info) e depois por data (mais recentes primeiro)
    const typePriority: Record<NotificationType, number> = {
      warning: 0, // Vencendo hoje - mais urgente
      error: 1, // Rejeitados
      success: 2, // Aprovados
      info: 3, // Vencendo amanhã
    };

    allNotifications.sort((a, b) => {
      // Primeiro, ordenar por prioridade do tipo
      const priorityDiff = typePriority[a.type] - typePriority[b.type];
      if (priorityDiff !== 0) return priorityDiff;

      // Depois, ordenar por data (mais recentes primeiro)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // Formatar a data para exibição
    return allNotifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      description: notification.description,
      type: notification.type,
      route: notification.route,
      date: this.formatDate(notification.createdAt, today),
    }));
  }

  /**
   * Notificações de Orçamentos:
   * - Vencendo amanhã
   * - Vencendo hoje
   * - Aprovado pelo cliente
   * - Rejeitado pelo cliente
   */
  private async getBudgetNotifications(
    organizationId: string,
    today: Date,
    tomorrow: Date
  ): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];

    // Orçamentos vencendo amanhã
    const budgetsExpiringTomorrow = await prisma.budget.findMany({
      where: {
        organizationId,
        deletedAt: null,
        archived: false,
        status: { in: ['DRAFT', 'SENT'] },
        expirationDate: {
          gte: startOfDay(tomorrow),
          lte: endOfDay(tomorrow),
        },
      },
      include: {
        client: { select: { name: true } },
      },
    });

    if (budgetsExpiringTomorrow.length > 0) {
      notifications.push({
        id: `budget-expiring-tomorrow-${Date.now()}`,
        title: 'Financeiro / Orçamento',
        description:
          budgetsExpiringTomorrow.length === 1
            ? `O orçamento #${budgetsExpiringTomorrow[0].code} vence amanhã!`
            : `Você tem ${budgetsExpiringTomorrow.length} orçamentos vencendo amanhã!`,
        type: 'info',
        route: '/finance/budgets',
        createdAt: today,
      });
    }

    // Orçamentos vencendo hoje
    const budgetsExpiringToday = await prisma.budget.findMany({
      where: {
        organizationId,
        deletedAt: null,
        archived: false,
        status: { in: ['DRAFT', 'SENT'] },
        expirationDate: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
      include: {
        client: { select: { name: true } },
      },
    });

    if (budgetsExpiringToday.length > 0) {
      notifications.push({
        id: `budget-expiring-today-${Date.now()}`,
        title: 'Financeiro / Orçamento',
        description:
          budgetsExpiringToday.length === 1
            ? `O orçamento #${budgetsExpiringToday[0].code} vence hoje!`
            : `Você tem ${budgetsExpiringToday.length} orçamentos vencendo hoje!`,
        type: 'warning',
        route: '/finance/budgets',
        createdAt: today,
      });
    }

    // Orçamentos aprovados recentemente (últimas 24h)
    const yesterday = addDays(today, -1);
    const approvedBudgets = await prisma.budget.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'ACCEPTED',
        approvedByClient: true,
        approvedAt: {
          gte: yesterday,
          lte: today,
        },
      },
      include: {
        client: { select: { name: true } },
      },
    });

    for (const budget of approvedBudgets) {
      notifications.push({
        id: `budget-approved-${budget.id}`,
        title: 'Financeiro / Orçamento',
        description: `O orçamento #${budget.code} foi aprovado pelo cliente${budget.client?.name ? ` (${budget.client.name})` : ''}!`,
        type: 'success',
        route: `/finance/budgets/${budget.id}`,
        createdAt: budget.approvedAt || today,
      });
    }

    // Orçamentos rejeitados recentemente (últimas 24h)
    const rejectedBudgets = await prisma.budget.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'REJECTED',
        approvedByClient: true, // Rejeitado pelo cliente via link
        approvedAt: {
          gte: yesterday,
          lte: today,
        },
      },
      include: {
        client: { select: { name: true } },
      },
    });

    for (const budget of rejectedBudgets) {
      notifications.push({
        id: `budget-rejected-${budget.id}`,
        title: 'Financeiro / Orçamento',
        description: `O orçamento #${budget.code} foi recusado pelo cliente${budget.client?.name ? ` (${budget.client.name})` : ''}.`,
        type: 'error',
        route: `/finance/budgets/${budget.id}`,
        createdAt: budget.approvedAt || today,
      });
    }

    return notifications;
  }

  /**
   * Notificações de Quadros (Cards):
   * - Vencendo amanhã
   * - Vencendo hoje
   */
  private async getBoardNotifications(
    organizationId: string,
    today: Date,
    tomorrow: Date
  ): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];

    // Cards vencendo amanhã
    const cardsDueTomorrow = await prisma.card.findMany({
      where: {
        isArchived: false,
        dueDate: {
          gte: startOfDay(tomorrow),
          lte: endOfDay(tomorrow),
        },
        column: {
          board: {
            organizationId,
            isArchived: false,
          },
        },
      },
      include: {
        column: {
          include: {
            board: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (cardsDueTomorrow.length > 0) {
      // Agrupar por board para mensagem mais informativa
      const boardsMap = new Map<string, { title: string; count: number; id: string }>();
      for (const card of cardsDueTomorrow) {
        const boardId = card.column.board.id;
        const existing = boardsMap.get(boardId);
        if (existing) {
          existing.count++;
        } else {
          boardsMap.set(boardId, {
            id: boardId,
            title: card.column.board.title,
            count: 1,
          });
        }
      }

      if (boardsMap.size === 1) {
        const board = Array.from(boardsMap.values())[0];
        notifications.push({
          id: `board-due-tomorrow-${board.id}`,
          title: 'Produção / Quadros',
          description:
            board.count === 1
              ? `Você tem 1 card vencendo amanhã no quadro "${board.title}"!`
              : `Você tem ${board.count} cards vencendo amanhã no quadro "${board.title}"!`,
          type: 'info',
          route: '/production/boards',
          createdAt: today,
        });
      } else {
        notifications.push({
          id: `boards-due-tomorrow-${Date.now()}`,
          title: 'Produção / Quadros',
          description: `Você tem ${cardsDueTomorrow.length} cards vencendo amanhã em ${boardsMap.size} quadros!`,
          type: 'info',
          route: '/production/boards',
          createdAt: today,
        });
      }
    }

    // Cards vencendo hoje
    const cardsDueToday = await prisma.card.findMany({
      where: {
        isArchived: false,
        dueDate: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
        column: {
          board: {
            organizationId,
            isArchived: false,
          },
        },
      },
      include: {
        column: {
          include: {
            board: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (cardsDueToday.length > 0) {
      // Agrupar por board
      const boardsMap = new Map<string, { title: string; count: number; id: string }>();
      for (const card of cardsDueToday) {
        const boardId = card.column.board.id;
        const existing = boardsMap.get(boardId);
        if (existing) {
          existing.count++;
        } else {
          boardsMap.set(boardId, {
            id: boardId,
            title: card.column.board.title,
            count: 1,
          });
        }
      }

      if (boardsMap.size === 1) {
        const board = Array.from(boardsMap.values())[0];
        notifications.push({
          id: `board-due-today-${board.id}`,
          title: 'Produção / Quadros',
          description:
            board.count === 1
              ? `Você tem 1 card com a data limite de hoje no quadro "${board.title}"!`
              : `Você tem ${board.count} cards com a data limite de hoje no quadro "${board.title}"!`,
          type: 'warning',
          route: '/production/boards',
          createdAt: today,
        });
      } else {
        notifications.push({
          id: `boards-due-today-${Date.now()}`,
          title: 'Produção / Quadros',
          description: `Você tem ${cardsDueToday.length} cards com a data limite de hoje em ${boardsMap.size} quadros!`,
          type: 'warning',
          route: '/production/boards',
          createdAt: today,
        });
      }
    }

    return notifications;
  }

  /**
   * Notificações de Contas a Pagar:
   * - Vencendo amanhã
   * - Vencendo hoje
   */
  private async getAccountsPayableNotifications(
    organizationId: string,
    today: Date,
    tomorrow: Date
  ): Promise<NotificationItem[]> {
    const notifications: NotificationItem[] = [];

    // Contas vencendo amanhã
    const accountsDueTomorrow = await prisma.accountsPayable.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'PENDING',
        dueDate: {
          gte: startOfDay(tomorrow),
          lte: endOfDay(tomorrow),
        },
      },
    });

    if (accountsDueTomorrow.length > 0) {
      notifications.push({
        id: `accounts-due-tomorrow-${Date.now()}`,
        title: 'Financeiro / Contas a Pagar',
        description:
          accountsDueTomorrow.length === 1
            ? `Você tem 1 conta a pagar vencendo amanhã!`
            : `Você tem ${accountsDueTomorrow.length} contas a pagar vencendo amanhã!`,
        type: 'info',
        route: '/finance/accounts-payable',
        createdAt: today,
      });
    }

    // Contas vencendo hoje
    const accountsDueToday = await prisma.accountsPayable.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'PENDING',
        dueDate: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    });

    if (accountsDueToday.length > 0) {
      notifications.push({
        id: `accounts-due-today-${Date.now()}`,
        title: 'Financeiro / Contas a Pagar',
        description:
          accountsDueToday.length === 1
            ? `Você tem 1 conta a pagar vencendo hoje!`
            : `Você tem ${accountsDueToday.length} contas a pagar vencendo hoje!`,
        type: 'warning',
        route: '/finance/accounts-payable',
        createdAt: today,
      });
    }

    return notifications;
  }

  /**
   * Formata a data para exibição relativa
   */
  private formatDate(date: Date, today: Date): string {
    if (isSameDay(date, today)) {
      return 'Hoje';
    }

    const yesterday = addDays(today, -1);
    if (isSameDay(date, yesterday)) {
      return 'Ontem';
    }

    // Para outras datas, retornar formato DD/MM
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }
}
