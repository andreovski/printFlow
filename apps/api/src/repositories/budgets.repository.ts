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
}
