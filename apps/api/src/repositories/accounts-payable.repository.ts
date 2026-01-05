import { AccountsPayable, AccountsPayableStatus, Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

// Include padrão para queries
const accountsPayableInclude = {
  tags: true,
};

export class AccountsPayableRepository {
  async create(data: Prisma.AccountsPayableUncheckedCreateInput): Promise<AccountsPayable> {
    return await prisma.accountsPayable.create({
      data,
      include: accountsPayableInclude,
    });
  }

  async findMany(
    organizationId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      search?: string;
      status?: AccountsPayableStatus;
    }
  ): Promise<AccountsPayable[]> {
    const where: Prisma.AccountsPayableWhereInput = {
      organizationId,
      deletedAt: null,
    };

    // Filtro por período (dueDate)
    if (filters?.startDate || filters?.endDate) {
      where.dueDate = {};
      if (filters.startDate) {
        where.dueDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.dueDate.lte = filters.endDate;
      }
    }

    // Filtro por status
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filtro por busca (supplier ou description)
    if (filters?.search) {
      where.OR = [
        { supplier: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.accountsPayable.findMany({
      where,
      include: accountsPayableInclude,
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  async findById(id: string): Promise<AccountsPayable | null> {
    return await prisma.accountsPayable.findUnique({
      where: { id },
      include: accountsPayableInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.AccountsPayableUncheckedUpdateInput
  ): Promise<AccountsPayable> {
    return await prisma.accountsPayable.update({
      where: { id },
      data,
      include: accountsPayableInclude,
    });
  }

  async delete(id: string): Promise<void> {
    // Buscar a conta para verificar se tem children
    const accountPayable = await prisma.accountsPayable.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!accountPayable) {
      throw new Error('Conta a pagar não encontrada');
    }

    const now = new Date();

    // Soft delete do registro principal
    await prisma.accountsPayable.update({
      where: { id },
      data: { deletedAt: now },
    });

    // Se tem children (é um parent), fazer soft delete de todas as children também
    if (accountPayable.children && accountPayable.children.length > 0) {
      const childrenIds = accountPayable.children.map((child) => child.id);
      await prisma.accountsPayable.updateMany({
        where: { id: { in: childrenIds } },
        data: { deletedAt: now },
      });
    }
  }

  async createMany(data: Prisma.AccountsPayableUncheckedCreateInput[]): Promise<AccountsPayable[]> {
    return await prisma.$transaction(
      data.map((item) =>
        prisma.accountsPayable.create({
          data: item,
          include: accountsPayableInclude,
        })
      )
    );
  }

  async findByIdWithRelations(id: string) {
    return await prisma.accountsPayable.findUnique({
      where: { id },
      include: {
        ...accountsPayableInclude,
        parent: {
          include: {
            children: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                installmentNumber: 'asc',
              },
            },
          },
        },
        children: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            installmentNumber: 'asc',
          },
        },
      },
    });
  }

  async updateManyAmounts(ids: string[], amount: number, installmentOf: number): Promise<void> {
    // amount já é o valor individual da parcela
    // totalAmount deve ser o valor individual multiplicado pelo total de parcelas
    const totalAmount = amount * installmentOf;
    await prisma.accountsPayable.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        amount,
        totalAmount,
      },
    });
  }

  async getKPIs(
    organizationId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{
    totalToPay: number;
    totalPaid: number;
    totalPending: number;
  }> {
    const where: Prisma.AccountsPayableWhereInput = {
      organizationId,
      deletedAt: null,
    };

    // Filtro por período (dueDate)
    if (filters?.startDate || filters?.endDate) {
      where.dueDate = {};
      if (filters.startDate) {
        where.dueDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.dueDate.lte = filters.endDate;
      }
    }

    // Total a Pagar (PENDING + OVERDUE)
    const totalToPayResult = await prisma.accountsPayable.aggregate({
      where: {
        ...where,
        status: {
          in: ['PENDING', 'OVERDUE'],
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Total Pago (PAID)
    const totalPaidResult = await prisma.accountsPayable.aggregate({
      where: {
        ...where,
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });

    // Total Pendente (apenas PENDING)
    const totalPendingResult = await prisma.accountsPayable.aggregate({
      where: {
        ...where,
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalToPay: Number(totalToPayResult._sum.amount || 0),
      totalPaid: Number(totalPaidResult._sum.amount || 0),
      totalPending: Number(totalPendingResult._sum.amount || 0),
    };
  }

  /**
   * Retorna array de datas que possuem contas a pagar (para calendar badges)
   */
  async getDatesWithBills(organizationId: string, startDate: Date, endDate: Date): Promise<Date[]> {
    const bills = await prisma.accountsPayable.findMany({
      where: {
        organizationId,
        deletedAt: null,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        dueDate: true,
      },
      distinct: ['dueDate'],
    });

    return bills.map((bill) => bill.dueDate);
  }
}
