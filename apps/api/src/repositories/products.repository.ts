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
    pageSize: number = 10
  ): Promise<{ data: Product[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          organizationId,
        },
        skip,
        take: pageSize,
      }),
      prisma.product.count({
        where: {
          organizationId,
        },
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
