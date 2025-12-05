import { shortUrlRepository } from '@/repositories/short-url.repository';

/**
 * Generate a random short code (6 characters)
 */
function generateShortCode(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export class ShortUrlService {
  /**
   * Create a short URL for an approval link
   */
  async createShortUrl(params: {
    targetUrl: string;
    budgetId?: string;
    expiresAt?: Date;
  }): Promise<{ code: string; shortUrl: string }> {
    // If there's an existing short URL for this budget, delete it
    if (params.budgetId) {
      await shortUrlRepository.deleteByBudgetId(params.budgetId);
    }

    // Generate unique code (retry if collision)
    let code: string;
    let attempts = 0;
    const maxAttempts = 5;

    do {
      code = generateShortCode();
      const existing = await shortUrlRepository.findByCode(code);
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique short code');
    }

    await shortUrlRepository.create({
      code,
      targetUrl: params.targetUrl,
      budgetId: params.budgetId,
      expiresAt: params.expiresAt,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shortUrl = `${frontendUrl}/a/${code}`;

    return { code, shortUrl };
  }

  /**
   * Get target URL by short code and increment clicks
   */
  async getTargetUrl(code: string): Promise<string | null> {
    const shortUrl = await shortUrlRepository.findByCode(code);

    if (!shortUrl) {
      return null;
    }

    // Check if expired
    if (shortUrl.expiresAt && new Date(shortUrl.expiresAt) < new Date()) {
      return null;
    }

    // Increment click count (fire and forget)
    shortUrlRepository.incrementClicks(code).catch(() => {
      // Ignore errors on click tracking
    });

    return shortUrl.targetUrl;
  }

  /**
   * Get existing short URL for a budget
   */
  async getExistingShortUrl(budgetId: string): Promise<string | null> {
    const shortUrl = await shortUrlRepository.findByBudgetId(budgetId);

    if (!shortUrl) {
      return null;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl}/a/${shortUrl.code}`;
  }
}

export const shortUrlService = new ShortUrlService();
