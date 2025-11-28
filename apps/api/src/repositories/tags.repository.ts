import { Prisma, Tag, TagScope } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export interface FindManyTagsParams {
  organizationId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  scope?: TagScope;
  active?: boolean;
}

export class TagsRepository {
  async create(data: Prisma.TagCreateInput): Promise<Tag> {
    const tag = await prisma.tag.create({
      data,
    });
    return tag;
  }

  async findMany({
    organizationId,
    page = 1,
    pageSize = 10,
    search,
    scope,
    active,
  }: FindManyTagsParams): Promise<{ data: Tag[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const where: Prisma.TagWhereInput = {
      organizationId,
      deletedAt: null, // Não trazer tags deletadas
      ...(search
        ? {
            name: { contains: search, mode: 'insensitive' },
          }
        : {}),
      ...(scope ? { scope } : {}),
      ...(active !== undefined ? { active } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tag.count({
        where,
      }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Tag | null> {
    const tag = await prisma.tag.findUnique({
      where: { id },
    });
    return tag;
  }

  async findByNameAndOrganization(name: string, organizationId: string): Promise<Tag | null> {
    const tag = await prisma.tag.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        organizationId,
      },
    });
    return tag;
  }

  async update(id: string, data: Prisma.TagUpdateInput): Promise<Tag> {
    const tag = await prisma.tag.update({
      where: { id },
      data,
    });
    return tag;
  }

  async softDelete(id: string): Promise<Tag> {
    const tag = await prisma.tag.update({
      where: { id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });
    return tag;
  }

  async delete(id: string): Promise<void> {
    await prisma.tag.delete({
      where: { id },
    });
  }
}
