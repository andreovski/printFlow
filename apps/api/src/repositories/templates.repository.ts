import { Prisma, Template, TemplateScope } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export interface FindManyTemplatesParams {
  organizationId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  scope?: TemplateScope;
  active?: boolean;
}

export class TemplatesRepository {
  async create(data: Prisma.TemplateCreateInput): Promise<Template> {
    const template = await prisma.template.create({
      data,
    });
    return template;
  }

  async findMany({
    organizationId,
    page = 1,
    pageSize = 10,
    search,
    scope,
    active,
  }: FindManyTemplatesParams): Promise<{ data: Template[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const where: Prisma.TemplateWhereInput = {
      organizationId,
      deletedAt: null, // Não trazer templates deletados
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' },
          }
        : {}),
      ...(scope ? { scope } : {}),
      ...(active !== undefined ? { active } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.template.count({
        where,
      }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Template | null> {
    const template = await prisma.template.findUnique({
      where: { id },
    });
    return template;
  }

  async findByNameAndOrganization(name: string, organizationId: string): Promise<Template | null> {
    const template = await prisma.template.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        organizationId,
        deletedAt: null,
      },
    });
    return template;
  }

  async update(id: string, data: Prisma.TemplateUpdateInput): Promise<Template> {
    const template = await prisma.template.update({
      where: { id },
      data,
    });
    return template;
  }

  async softDelete(id: string): Promise<Template> {
    const template = await prisma.template.update({
      where: { id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });
    return template;
  }

  async delete(id: string): Promise<void> {
    await prisma.template.delete({
      where: { id },
    });
  }
}
