import { Budget, BudgetStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export class BudgetsRepository {
  async create(data: Prisma.BudgetUncheckedCreateInput): Promise<Budget> {
    return await prisma.budget.create({
      data,
      include: {
        items: true,
        tags: true,
        client: true,
      },
    });
  }

  async findMany(
    organizationId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: Budget[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.budget.findMany({
        where: {
          organizationId,
          deletedAt: null,
          archived: false,
        },
        include: {
          client: true,
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.budget.count({
        where: {
          organizationId,
          deletedAt: null,
          archived: false,
        },
      }),
    ]);

    return { data, total };
  }

  async findArchived(
    organizationId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ data: Budget[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.budget.findMany({
        where: {
          organizationId,
          deletedAt: null,
          archived: true,
        },
        include: {
          client: true,
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.budget.count({
        where: {
          organizationId,
          deletedAt: null,
          archived: true,
        },
      }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Budget | null> {
    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        items: true,
        tags: true,
        client: true,
      },
    });

    if (budget?.deletedAt) return null;

    return budget;
  }

  /**
   * Check if a budget exists without loading relations
   * Much more efficient than findById when you only need to verify existence
   */
  async exists(id: string): Promise<boolean> {
    const count = await prisma.budget.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  /**
   * Get budget status only - optimized for status checks
   */
  async findStatusById(id: string): Promise<{ id: string; status: string } | null> {
    const budget = await prisma.budget.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!budget || budget.deletedAt) return null;

    return { id: budget.id, status: budget.status };
  }

  /**
   * Find budget by public approval token with organization info
   */
  async findByApprovalToken(token: string) {
    const budget = await prisma.budget.findUnique({
      where: { approvalToken: token },
      include: {
        items: true,
        client: {
          select: {
            name: true,
          },
        },
        organization: {
          select: {
            name: true,
            fantasyName: true,
            mainPhone: true,
            mainEmail: true,
          },
        },
      },
    });

    if (budget?.deletedAt) return null;

    return budget;
  }

  /**
   * Set approval token for a budget
   */
  async setApprovalToken(id: string, token: string): Promise<Budget> {
    return await prisma.budget.update({
      where: { id },
      data: { approvalToken: token },
      include: {
        items: true,
        tags: true,
        client: true,
      },
    });
  }

  /**
   * Approve budget via public link (client approval)
   */
  async approveByClient(id: string): Promise<Budget> {
    return await prisma.budget.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        approvedByClient: true,
        approvedAt: new Date(),
      },
      include: {
        items: true,
        tags: true,
        client: true,
      },
    });
  }

  /**
   * Reject budget via public link (client rejection)
   */
  async rejectByClient(id: string, reason?: string): Promise<Budget> {
    return await prisma.budget.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedByClient: true, // True because it came from the client via link
        approvedAt: new Date(),
        rejectionReason: reason || null,
      },
      include: {
        items: true,
        tags: true,
        client: true,
      },
    });
  }

  async update(id: string, data: Prisma.BudgetUncheckedUpdateInput): Promise<Budget> {
    return await prisma.budget.update({
      where: { id },
      data,
      include: {
        items: true,
        tags: true,
        client: true,
      },
    });
  }

  /**
   * Optimized update - doesn't load relations
   * Use when you don't need the full budget after update
   */
  async updateOptimized(
    id: string,
    data: Prisma.BudgetUncheckedUpdateInput
  ): Promise<{ id: string; code: number; status: string }> {
    const result = await prisma.budget.update({
      where: { id },
      data,
      select: {
        id: true,
        code: true,
        status: true,
      },
    });
    return { id: result.id, code: result.code, status: result.status };
  }

  /**
   * Update budget status only - optimized version without loading relations
   * Returns only the fields needed for status update confirmation
   */
  async updateStatusOnly(
    id: string,
    status: BudgetStatus
  ): Promise<{ id: string; status: string; code: number }> {
    const result = await prisma.budget.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        code: true,
      },
    });
    return { id: result.id, status: result.status, code: result.code };
  }

  /**
   * Simple update without loading relations - for cases where you don't need the result
   */
  async updateSimple(id: string, data: Prisma.BudgetUncheckedUpdateInput): Promise<void> {
    await prisma.budget.update({
      where: { id },
      data,
    });
  }

  async updateWithItems(
    id: string,
    data: Prisma.BudgetUncheckedUpdateInput & { tagIds?: string[] },
    itemsData: Prisma.BudgetItemUncheckedCreateWithoutBudgetInput[]
  ): Promise<Budget> {
    return await prisma.$transaction(async (tx) => {
      await tx.budgetItem.deleteMany({ where: { budgetId: id } });

      const { tagIds, ...budgetData } = data;

      return await tx.budget.update({
        where: { id },
        data: {
          ...budgetData,
          tags: tagIds ? { set: tagIds.map((tagId) => ({ id: tagId })) } : undefined,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
          tags: true,
          client: true,
        },
      });
    });
  }

  /**
   * Optimized updateWithItems - doesn't load relations after update
   * Use when you don't need the full budget after update
   */
  async updateWithItemsOptimized(
    id: string,
    data: Prisma.BudgetUncheckedUpdateInput & { tagIds?: string[] },
    itemsData: Prisma.BudgetItemUncheckedCreateWithoutBudgetInput[]
  ): Promise<{ id: string; code: number; status: string }> {
    return await prisma.$transaction(async (tx) => {
      await tx.budgetItem.deleteMany({ where: { budgetId: id } });

      const { tagIds, ...budgetData } = data;

      const result = await tx.budget.update({
        where: { id },
        data: {
          ...budgetData,
          tags: tagIds ? { set: tagIds.map((tagId) => ({ id: tagId })) } : undefined,
          items: {
            create: itemsData,
          },
        },
        select: {
          id: true,
          code: true,
          status: true,
        },
      });
      return { id: result.id, code: result.code, status: result.status };
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.budget.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async archive(id: string): Promise<void> {
    await prisma.budget.update({
      where: { id },
      data: {
        archived: true,
      },
    });
  }

  /**
   * Retorna orçamentos aprovados (ACCEPTED) para seleção no vínculo com card.
   * Inclui apenas dados necessários para o select: id, code, total, cliente, tags e items.
   */
  async findApprovedForCardLink(
    organizationId: string,
    search?: string
  ): Promise<
    Array<{
      id: string;
      code: number;
      total: Prisma.Decimal;
      notes: string | null;
      client: { name: string; phone: string };
      tags: Array<{ id: string; name: string; color: string; scope: string }>;
      items: Array<{ id: string; name: string; quantity: number }>;
      attachments: Array<{
        id: string;
        name: string;
        url: string;
        key: string;
        size: number;
        mimeType: string | null;
      }>;
    }>
  > {
    const budgets = await prisma.budget.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: 'ACCEPTED',
        ...(search && {
          OR: [
            { client: { name: { contains: search, mode: 'insensitive' } } },
            { client: { phone: { contains: search, mode: 'insensitive' } } },
            { code: isNaN(Number(search)) ? undefined : Number(search) },
          ],
        }),
      },
      select: {
        id: true,
        code: true,
        total: true,
        notes: true,
        client: {
          select: {
            name: true,
            phone: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
            scope: true,
          },
        },
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
          },
        },
        attachments: {
          select: {
            id: true,
            name: true,
            url: true,
            key: true,
            size: true,
            mimeType: true,
          },
        },
      },
      orderBy: {
        code: 'desc',
      },
      take: 50, // Limita a 50 resultados para performance
    });

    return budgets;
  }
}
