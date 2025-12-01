import { Attachment, Prisma } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export interface CreateAttachmentDTO {
  name: string;
  url: string;
  key: string;
  size: number;
  mimeType?: string | null;
  organizationId: string;
  budgetId?: string | null;
  cardId?: string | null;
  sourceBudgetAttachmentId?: string | null;
}

export class AttachmentsRepository {
  async create(data: CreateAttachmentDTO): Promise<Attachment> {
    const attachment = await prisma.attachment.create({
      data,
    });
    return attachment;
  }

  async createMany(data: CreateAttachmentDTO[]): Promise<Prisma.BatchPayload> {
    return await prisma.attachment.createMany({
      data,
    });
  }

  async findById(id: string): Promise<Attachment | null> {
    return await prisma.attachment.findUnique({
      where: { id },
    });
  }

  async findByKey(key: string): Promise<Attachment | null> {
    return await prisma.attachment.findUnique({
      where: { key },
    });
  }

  async findByBudgetId(budgetId: string): Promise<Attachment[]> {
    return await prisma.attachment.findMany({
      where: { budgetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCardId(cardId: string): Promise<Attachment[]> {
    return await prisma.attachment.findMany({
      where: { cardId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrganizationId(
    organizationId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: Attachment[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.attachment.findMany({
        where: { organizationId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attachment.count({
        where: { organizationId },
      }),
    ]);

    return { data, total };
  }

  async validateBudgetExists(budgetId: string, organizationId: string): Promise<boolean> {
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      select: { organizationId: true },
    });

    return budget?.organizationId === organizationId;
  }

  async validateCardExists(cardId: string, organizationId: string): Promise<boolean> {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        column: {
          select: {
            board: {
              select: {
                organizationId: true,
              },
            },
          },
        },
      },
    });

    return card?.column?.board?.organizationId === organizationId;
  }

  async delete(id: string): Promise<Attachment> {
    return await prisma.attachment.delete({
      where: { id },
    });
  }

  async deleteByKey(key: string): Promise<Attachment> {
    return await prisma.attachment.delete({
      where: { key },
    });
  }

  async deleteByBudgetId(budgetId: string): Promise<Prisma.BatchPayload> {
    return await prisma.attachment.deleteMany({
      where: { budgetId },
    });
  }

  async deleteByCardId(cardId: string): Promise<Prisma.BatchPayload> {
    return await prisma.attachment.deleteMany({
      where: { cardId },
    });
  }
}
