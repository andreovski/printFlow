import { prisma } from '@/lib/prisma';
import { Prisma, Product } from '@prisma/client';

export class ProductsRepository {
  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    const product = await prisma.product.create({
      data,
    });
    return product;
  }

  async findMany(organizationId: string): Promise<Product[]> {
    const products = await prisma.product.findMany({
      where: {
        organizationId,
      },
    });
    return products;
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
}
