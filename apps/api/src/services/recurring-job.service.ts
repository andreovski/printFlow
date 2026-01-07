import { AccountsPayableStatus, JobStatus } from '@prisma/client';
import { addMonths, lastDayOfMonth, getDaysInMonth } from 'date-fns';

import { prisma } from '@/lib/prisma';

import { NotificationService } from './notification.service';

const MAX_RECURRING_MONTHS = 60;
const CHUNK_SIZE = 20;

interface RecurringAccount {
  organizationId: string;
  supplier: string;
  icon?: string | null;
  dueDate: Date;
  amount: number;
  status?: AccountsPayableStatus;
  tagIds?: string[];
  description?: string | null;
  userId: string; // Para notificar após conclusão
}

export class RecurringJobService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Ajusta data para o último dia do mês quando o dia não existe no mês de destino
   * Ex: 31/jan + 1 mês = 28/fev (ou 29 se bissexto)
   */
  private getValidRecurringDate(baseDate: Date, monthOffset: number): Date {
    const targetDate = addMonths(baseDate, monthOffset);
    const baseDayOfMonth = baseDate.getDate();
    const targetDaysInMonth = getDaysInMonth(targetDate);

    // Se o dia base é maior que os dias do mês alvo, usar último dia
    if (baseDayOfMonth > targetDaysInMonth) {
      return lastDayOfMonth(targetDate);
    }

    return targetDate;
  }

  /**
   * Cria 60 contas recorrentes em chunks de 20
   * Retorna o ID do parent para que o controller possa retornar imediatamente
   */
  async createRecurringAccounts(data: RecurringAccount) {
    const { tagIds, userId, ...accountData } = data;

    try {
      // 1. Criar conta parent (posição 1)
      const parent = await prisma.accountsPayable.create({
        data: {
          ...accountData,
          installments: 1,
          totalAmount: accountData.amount,
          isRecurring: true,
          recurringPosition: 1,
          recurringParentId: null,
          creationJobStatus: JobStatus.PROCESSING,
          tags: tagIds?.length
            ? {
                connect: tagIds.map((id) => ({ id })),
              }
            : undefined,
        },
      });

      // 2. Processar criação das 59 contas restantes em background
      this.processRecurringCreation(parent.id, accountData, tagIds || [], userId).catch((error) => {
        console.error('Erro ao processar contas recorrentes:', error);
      });

      return parent;
    } catch (error) {
      console.error('Erro ao criar conta parent recorrente:', error);
      throw new Error('Falha ao criar conta recorrente');
    }
  }

  /**
   * Processa criação das 59 contas restantes em chunks
   * Executa de forma assíncrona após retornar resposta ao usuário
   */
  private async processRecurringCreation(
    parentId: string,
    baseData: Omit<RecurringAccount, 'userId' | 'tagIds'>,
    tagIds: string[],
    userId: string
  ) {
    try {
      const parent = await prisma.accountsPayable.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new Error('Parent não encontrado');
      }

      // Preparar dados das 59 contas (posições 2 a 60)
      const recurringAccounts = [];
      for (let i = 2; i <= MAX_RECURRING_MONTHS; i++) {
        const dueDate = this.getValidRecurringDate(baseData.dueDate, i - 1);

        recurringAccounts.push({
          organizationId: baseData.organizationId,
          supplier: baseData.supplier,
          icon: baseData.icon,
          dueDate,
          amount: baseData.amount,
          status: baseData.status || 'PENDING',
          description: baseData.description,
          installments: 1,
          totalAmount: baseData.amount,
          isRecurring: true,
          recurringPosition: i,
          recurringParentId: parentId,
          paidDate: null,
        });
      }

      // Criar em chunks de 20
      for (let i = 0; i < recurringAccounts.length; i += CHUNK_SIZE) {
        const chunk = recurringAccounts.slice(i, i + CHUNK_SIZE);

        // Criar registros em batch
        const created = await prisma.accountsPayable.createManyAndReturn({
          data: chunk,
        });

        // Conectar tags a cada registro do chunk
        if (tagIds.length > 0) {
          await Promise.all(
            created.map((account) =>
              prisma.accountsPayable.update({
                where: { id: account.id },
                data: {
                  tags: {
                    connect: tagIds.map((id) => ({ id })),
                  },
                },
              })
            )
          );
        }
      }

      // Atualizar status do job no parent
      await prisma.accountsPayable.update({
        where: { id: parentId },
        data: { creationJobStatus: JobStatus.COMPLETED },
      });

      // Notificar usuário
      await this.notificationService.create({
        userId,
        type: 'RECURRING_JOB_COMPLETED',
        title: 'Contas recorrentes criadas',
        message: `${MAX_RECURRING_MONTHS} contas recorrentes de "${baseData.supplier}" foram criadas com sucesso.`,
        metadata: {
          parentId,
          supplier: baseData.supplier,
          count: MAX_RECURRING_MONTHS,
        },
      });
    } catch (error) {
      console.error('Erro no processamento de contas recorrentes:', error);

      // Marcar job como falhado
      await prisma.accountsPayable.update({
        where: { id: parentId },
        data: { creationJobStatus: JobStatus.FAILED },
      });

      // Soft delete das contas criadas parcialmente
      await prisma.accountsPayable.updateMany({
        where: {
          recurringParentId: parentId,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      // Soft delete do parent também
      await prisma.accountsPayable.update({
        where: { id: parentId },
        data: { deletedAt: new Date() },
      });

      // Notificar usuário sobre falha
      await this.notificationService.create({
        userId,
        type: 'RECURRING_JOB_FAILED',
        title: 'Erro ao criar contas recorrentes',
        message: `Não foi possível criar as contas recorrentes de "${baseData.supplier}". Tente novamente.`,
        metadata: {
          parentId,
          supplier: baseData.supplier,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });

      throw error;
    }
  }

  /**
   * Atualiza uma conta recorrente e opcionalmente propaga para todas as futuras não pagas
   */
  async updateRecurring(
    id: string,
    data: Partial<RecurringAccount>,
    applyToFuture: boolean = false
  ) {
    const { tagIds, userId, ...updateData } = data;

    const account = await prisma.accountsPayable.findUnique({
      where: { id },
      include: {
        recurringParent: {
          include: {
            recurringChildren: {
              where: { deletedAt: null },
              orderBy: { recurringPosition: 'asc' },
            },
          },
        },
        recurringChildren: {
          where: { deletedAt: null },
          orderBy: { recurringPosition: 'asc' },
        },
      },
    });

    if (!account || !account.isRecurring) {
      throw new Error('Conta recorrente não encontrada');
    }

    // Se não deve aplicar para futuras, atualizar apenas esta conta
    if (!applyToFuture) {
      return await prisma.accountsPayable.update({
        where: { id },
        data: {
          ...updateData,
          tags: tagIds
            ? {
                set: tagIds.map((id) => ({ id })),
              }
            : undefined,
        },
        include: {
          tags: true,
        },
      });
    }

    // Aplicar para todas as futuras não pagas
    const parent = account.recurringPosition === 1 ? account : account.recurringParent;
    if (!parent) {
      throw new Error('Parent não encontrado');
    }

    const allAccounts = [parent, ...(parent.recurringChildren || [])].sort(
      (a, b) => (a.recurringPosition || 0) - (b.recurringPosition || 0)
    );

    const futureUnpaid = allAccounts.filter(
      (acc) =>
        acc.recurringPosition! >= account.recurringPosition! &&
        acc.status !== 'PAID' &&
        !acc.deletedAt
    );

    // Atualizar todas as contas futuras não pagas
    await Promise.all(
      futureUnpaid.map((acc) =>
        prisma.accountsPayable.update({
          where: { id: acc.id },
          data: {
            ...updateData,
            tags: tagIds
              ? {
                  set: tagIds.map((id) => ({ id })),
                }
              : undefined,
          },
        })
      )
    );

    // Retornar a conta atualizada
    return await prisma.accountsPayable.findUnique({
      where: { id },
      include: { tags: true },
    });
  }

  /**
   * Deleta uma conta recorrente e opcionalmente todas as futuras
   */
  async deleteRecurring(id: string, deleteAllFuture: boolean = false) {
    const account = await prisma.accountsPayable.findUnique({
      where: { id },
      include: {
        recurringParent: {
          include: {
            recurringChildren: {
              where: { deletedAt: null },
              orderBy: { recurringPosition: 'asc' },
            },
          },
        },
        recurringChildren: {
          where: { deletedAt: null },
          orderBy: { recurringPosition: 'asc' },
        },
      },
    });

    if (!account || !account.isRecurring) {
      throw new Error('Conta recorrente não encontrada');
    }

    // Se não deve deletar futuras, deletar apenas esta
    if (!deleteAllFuture) {
      await prisma.accountsPayable.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return;
    }

    // Deletar todas as futuras (incluindo esta)
    const parent = account.recurringPosition === 1 ? account : account.recurringParent;
    if (!parent) {
      throw new Error('Parent não encontrado');
    }

    const allAccounts = [parent, ...(parent.recurringChildren || [])].sort(
      (a, b) => (a.recurringPosition || 0) - (b.recurringPosition || 0)
    );

    const futureAccounts = allAccounts.filter(
      (acc) => acc.recurringPosition! >= account.recurringPosition! && !acc.deletedAt
    );

    // Soft delete de todas as futuras
    await prisma.accountsPayable.updateMany({
      where: {
        id: { in: futureAccounts.map((acc) => acc.id) },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Obtém informações sobre a série recorrente para deletar ou atualizar
   */
  private async getRecurringInfo(id: string) {
    const account = await prisma.accountsPayable.findUnique({
      where: { id },
      include: {
        recurringParent: {
          include: {
            recurringChildren: {
              where: { deletedAt: null },
              orderBy: { recurringPosition: 'asc' },
            },
          },
        },
        recurringChildren: {
          where: { deletedAt: null },
          orderBy: { recurringPosition: 'asc' },
        },
      },
    });

    if (!account || !account.isRecurring) {
      throw new Error('Conta recorrente não encontrada');
    }

    const parent = account.recurringPosition === 1 ? account : account.recurringParent;
    if (!parent) {
      throw new Error('Parent não encontrado');
    }

    const allAccounts = [parent, ...(parent.recurringChildren || [])].sort(
      (a, b) => (a.recurringPosition || 0) - (b.recurringPosition || 0)
    );

    const futureAccounts = allAccounts.filter(
      (acc) => acc.recurringPosition! > account.recurringPosition! && !acc.deletedAt
    );

    return {
      parent,
      allAccounts,
      futureCount: futureAccounts.length,
    };
  }
}
