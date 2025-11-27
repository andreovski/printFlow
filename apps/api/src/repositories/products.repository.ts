import { Prisma, Product } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export class ProductsRepository {
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    const product = await prisma.product.create({
      data,
    });
    return product;
  }

  async findMany(
    organizationId: string,
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ): Promise<{ data: Product[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductWhereInput = {
      organizationId,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
      }),
      prisma.product.count({
        where,
      }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    return product;
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
      },
    });
    return products;
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    const product = await prisma.product.update({
      where: { id },
      data,
    });
    return product;
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({
      where: { id },
    });
  }
}
