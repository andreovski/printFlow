import { AccountsPayable, AccountsPayableStatus } from '@prisma/client';
import { addMonths, isPast } from 'date-fns';

import { prisma } from '@/lib/prisma';
import { AccountsPayableRepository } from '@/repositories/accounts-payable.repository';

interface CreateAccountsPayableDTO {
  organizationId: string;
  supplier: string;
  icon?: string | null;
  dueDate: Date;
  amount: number;
  status?: AccountsPayableStatus;
  installments?: number;
  tagIds?: string[];
  description?: string | null;
  paidDate?: Date | null;
}

interface UpdateAccountsPayableDTO {
  supplier?: string;
  icon?: string | null;
  dueDate?: Date;
  amount?: number;
  status?: AccountsPayableStatus;
  installments?: number;
  tagIds?: string[];
  description?: string | null;
  paidDate?: Date | null;
}

export class AccountsPayableService {
  private repository: AccountsPayableRepository;

  constructor() {
    this.repository = new AccountsPayableRepository();
  }

  /**
   * Computa o status real considerando se está atrasado
   */
  private computeStatus(status: AccountsPayableStatus, dueDate: Date): AccountsPayableStatus {
    if (status === 'PENDING' && isPast(dueDate) && !this.isToday(dueDate)) {
      return 'OVERDUE';
    }
    return status;
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Aplica computed status em uma conta a pagar
   */
  private applyComputedStatus(accountPayable: AccountsPayable): AccountsPayable {
    return {
      ...accountPayable,
      status: this.computeStatus(accountPayable.status, accountPayable.dueDate),
    };
  }

  /**
   * Aplica computed status em array de contas
   */
  private applyComputedStatusToArray(accountsPayable: AccountsPayable[]): AccountsPayable[] {
    return accountsPayable.map((ap) => this.applyComputedStatus(ap));
  }

  async create(
    data: CreateAccountsPayableDTO
  ): Promise<{ accountsPayable: AccountsPayable[]; count: number }> {
    const { tagIds, ...accountPayableData } = data;

    const installments = data.installments || 1;
    const totalAmount = data.amount; // data.amount já é o valor total
    const installmentAmount = totalAmount / installments; // Valor individual de cada parcela

    // Se for parcela única, criar registro normal
    if (installments === 1) {
      const accountPayable = await this.repository.create({
        ...accountPayableData,
        amount: totalAmount,
        installments: 1,
        totalAmount: totalAmount,
        installmentNumber: null,
        installmentOf: null,
        parentId: null,
        tags: tagIds?.length
          ? {
              connect: tagIds.map((id) => ({ id })),
            }
          : undefined,
      });

      return {
        accountsPayable: [this.applyComputedStatus(accountPayable)],
        count: 1,
      };
    }

    // Criar parcela principal (parent)
    const parent = await this.repository.create({
      ...accountPayableData,
      amount: installmentAmount,
      installments,
      totalAmount,
      installmentNumber: 1,
      installmentOf: installments,
      parentId: null,
      tags: tagIds?.length
        ? {
            connect: tagIds.map((id) => ({ id })),
          }
        : undefined,
    });

    // Gerar parcelas subsequentes
    const subsequentData = [];
    for (let i = 2; i <= installments; i++) {
      subsequentData.push({
        organizationId: data.organizationId,
        supplier: data.supplier,
        icon: data.icon,
        dueDate: addMonths(data.dueDate, i - 1),
        amount: installmentAmount,
        status: data.status || 'PENDING',
        installments,
        totalAmount,
        installmentNumber: i,
        installmentOf: installments,
        parentId: parent.id,
        description: data.description,
        paidDate: null,
      });
    }

    const children = await this.repository.createMany(subsequentData);

    // Conectar tags às parcelas subsequentes
    if (tagIds?.length) {
      const childrenIds = children.map((c) => c.id);
      await this.repository.updateManyAmounts(childrenIds, installmentAmount, installments);

      // Reconectar tags manualmente pois createMany não suporta connect
      for (const child of children) {
        await this.repository.update(child.id, {
          tags: {
            connect: tagIds.map((id) => ({ id })),
          },
        });
      }
    }

    // Buscar novamente todas as parcelas com tags
    const allInstallments = [parent, ...children];
    const allWithTags = await Promise.all(
      allInstallments.map((inst) => this.repository.findById(inst.id))
    );

    return {
      accountsPayable: allWithTags
        .filter((inst): inst is AccountsPayable => inst !== null)
        .map((inst) => this.applyComputedStatus(inst)),
      count: installments,
    };
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
    const accountsPayable = await this.repository.findMany(organizationId, filters);
    return this.applyComputedStatusToArray(accountsPayable);
  }

  async findById(id: string): Promise<AccountsPayable | null> {
    const accountPayable = await this.repository.findById(id);
    if (!accountPayable) return null;
    return this.applyComputedStatus(accountPayable);
  }

  async update(id: string, data: UpdateAccountsPayableDTO): Promise<AccountsPayable> {
    const existingAccountPayable = await this.repository.findById(id);
    if (!existingAccountPayable) {
      throw new Error('Conta a pagar não encontrada');
    }

    const { tagIds, ...updateData } = data;

    // Para parcelas, amount já é o valor individual
    // totalAmount permanece o mesmo a menos que seja explicitamente alterado
    const accountPayable = await this.repository.update(id, {
      ...updateData,
      tags: tagIds
        ? {
            set: tagIds.map((id) => ({ id })),
          }
        : undefined,
    });

    return this.applyComputedStatus(accountPayable);
  }

  async updateWithRecalculation(
    id: string,
    data: UpdateAccountsPayableDTO,
    recalculateNext: boolean = false
  ): Promise<AccountsPayable> {
    const existingAccountPayable = await this.repository.findByIdWithRelations(id);
    if (!existingAccountPayable) {
      throw new Error('Conta a pagar não encontrada');
    }

    const { tagIds, ...updateData } = data;

    // Atualizar registro atual (amount já é o valor individual da parcela)
    const accountPayable = await this.repository.update(id, {
      ...updateData,
      tags: tagIds
        ? {
            set: tagIds.map((id) => ({ id })),
          }
        : undefined,
    });

    // Se deve recalcular e tem número de parcela, atualizar subsequentes
    // Só recalcula se o amount realmente mudou
    const amountChanged =
      data.amount !== undefined && data.amount !== Number(existingAccountPayable.amount);

    if (
      recalculateNext &&
      amountChanged &&
      existingAccountPayable.installmentNumber &&
      existingAccountPayable.installmentOf
    ) {
      // Buscar parent para obter todos os children
      const parent =
        existingAccountPayable.installmentNumber === 1
          ? existingAccountPayable
          : existingAccountPayable.parent;

      if (parent && parent.children) {
        // Obter TODAS as parcelas ordenadas (incluindo parent)
        const allInstallments = [parent, ...parent.children].sort(
          (a, b) => (a.installmentNumber || 0) - (b.installmentNumber || 0)
        );

        const originalTotalAmount = Number(existingAccountPayable.totalAmount);
        const originalTotalCents = Math.round(originalTotalAmount * 100);

        // 1. Somar valores de parcelas até a atual (incluindo novo valor)
        let totalPaidCents = 0;
        for (const inst of allInstallments) {
          if (inst.installmentNumber! <= existingAccountPayable.installmentNumber!) {
            if (inst.id === id) {
              // Usar o novo valor que está sendo salvo
              totalPaidCents += Math.round(data.amount * 100);
            } else {
              totalPaidCents += Math.round(Number(inst.amount) * 100);
            }
          }
        }

        // 2. Calcular saldo devedor em centavos
        const remainingCents = originalTotalCents - totalPaidCents;

        // 3. Filtrar parcelas NÃO PAGAS subsequentes à atual
        const unpaidSubsequent = allInstallments.filter(
          (inst: AccountsPayable) =>
            inst.installmentNumber! > existingAccountPayable.installmentNumber! &&
            inst.status !== 'PAID'
        );

        if (unpaidSubsequent.length > 0) {
          // 4. Distribuir saldo devedor entre parcelas não pagas
          const baseAmountCents = Math.floor(remainingCents / unpaidSubsequent.length);
          const restCents = remainingCents % unpaidSubsequent.length;

          // 5. Atualizar cada parcela não paga
          for (let i = 0; i < unpaidSubsequent.length; i++) {
            const inst = unpaidSubsequent[i];
            // Distribuir resto de 1 centavo nas primeiras parcelas
            const amountCents = baseAmountCents + (i < restCents ? 1 : 0);
            const amountReais = amountCents / 100;

            await prisma.accountsPayable.update({
              where: { id: inst.id },
              data: {
                amount: amountReais,
                totalAmount: originalTotalAmount,
              },
            });
          }
        } else if (remainingCents < 0) {
          // Excedente: totalPago > originalTotal
          // Não há parcelas futuras para ajustar
          console.log(
            `Excedente detectado: ${Math.abs(remainingCents) / 100} acima do total original`
          );
        }
      }
    }

    return this.applyComputedStatus(accountPayable);
  }

  async getDeleteInfo(id: string): Promise<{
    isParent: boolean;
    hasChildren: boolean;
    childrenCount: number;
    siblingIds: string[];
  }> {
    const accountPayable = await this.repository.findByIdWithRelations(id);
    if (!accountPayable) {
      throw new Error('Conta a pagar não encontrada');
    }

    const isParent = accountPayable.installmentNumber === 1 && !!accountPayable.children;
    const hasChildren = !!accountPayable.children && accountPayable.children.length > 0;
    const childrenCount = accountPayable.children?.length || 0;

    // Se tem parent, buscar siblings (outras parcelas da série)
    let siblingIds: string[] = [];
    if (accountPayable.parent && accountPayable.parent.children) {
      siblingIds = accountPayable.parent.children
        .filter((child: AccountsPayable) => child.id !== id)
        .map((child: AccountsPayable) => child.id);
    } else if (accountPayable.children) {
      // Se é parent, siblings são os children
      siblingIds = accountPayable.children.map((child: AccountsPayable) => child.id);
    }

    return {
      isParent,
      hasChildren,
      childrenCount,
      siblingIds,
    };
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
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
    return await this.repository.getKPIs(organizationId, filters);
  }

  async getDatesWithBills(organizationId: string, startDate: Date, endDate: Date): Promise<Date[]> {
    return await this.repository.getDatesWithBills(organizationId, startDate, endDate);
  }
}
