import { prisma } from '@/lib/prisma';

export class MetricsRepository {
  async getMetrics(organizationId: string) {
    const [totalClients, totalProducts] = await Promise.all([
      prisma.client.count({
        where: {
          organizationId,
        },
      }),
      prisma.product.count({
        where: {
          organizationId,
        },
      }),
    ]);

    return {
      totalClients,
      totalProducts,
    };
  }
}
