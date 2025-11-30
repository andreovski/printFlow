import { Budget, Prisma } from '@prisma/client';

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
      total: any;
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
