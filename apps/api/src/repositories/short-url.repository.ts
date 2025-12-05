import { prisma } from '../lib/prisma';

export class ShortUrlRepository {
  /**
   * Create a new short URL
   */
  async create(data: { code: string; targetUrl: string; budgetId?: string; expiresAt?: Date }) {
    return await prisma.shortUrl.create({
      data: {
        code: data.code,
        targetUrl: data.targetUrl,
        budgetId: data.budgetId,
        expiresAt: data.expiresAt,
      },
    });
  }

  /**
   * Find short URL by code
   */
  async findByCode(code: string) {
    return await prisma.shortUrl.findUnique({
      where: { code },
    });
  }

  /**
   * Find short URL by budget ID
   */
  async findByBudgetId(budgetId: string) {
    return await prisma.shortUrl.findFirst({
      where: { budgetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Increment click count
   */
  async incrementClicks(code: string) {
    return await prisma.shortUrl.update({
      where: { code },
      data: { clicks: { increment: 1 } },
    });
  }

  /**
   * Delete short URL by budget ID (when generating new link)
   */
  async deleteByBudgetId(budgetId: string) {
    return await prisma.shortUrl.deleteMany({
      where: { budgetId },
    });
  }
}

export const shortUrlRepository = new ShortUrlRepository();
