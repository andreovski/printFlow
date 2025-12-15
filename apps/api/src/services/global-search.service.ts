import { PrismaClient } from '@prisma/client';

interface SearchResultBudget {
  id: string;
  code: number;
  status: string;
  total: number;
  createdAt: Date;
  client: {
    name: string;
    phone: string;
  };
  rank: number;
}

interface SearchResultCard {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  dueDate: Date | null;
  column: {
    title: string;
    board: {
      title: string;
    };
  };
  rank: number;
}

export interface GlobalSearchResult {
  budgets: SearchResultBudget[];
  cards: SearchResultCard[];
  totalBudgets: number;
  totalCards: number;
}

interface SearchOptions {
  query: string;
  organizationId: string;
  types?: ('budgets' | 'cards')[];
  limit?: number;
}

export class GlobalSearchService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async search(options: SearchOptions): Promise<GlobalSearchResult> {
    const { query, organizationId, types = ['budgets', 'cards'], limit = 25 } = options;

    // Minimum query length validation
    if (query.trim().length < 3) {
      return {
        budgets: [],
        cards: [],
        totalBudgets: 0,
        totalCards: 0,
      };
    }

    const isCodeSearch = query.trim().startsWith('#');
    const searchQuery = isCodeSearch ? query.trim().substring(1) : query.trim();

    const results: GlobalSearchResult = {
      budgets: [],
      cards: [],
      totalBudgets: 0,
      totalCards: 0,
    };

    // Search budgets
    if (types.includes('budgets')) {
      if (isCodeSearch) {
        // Search only by code when # prefix is present
        const codeNumber = parseInt(searchQuery, 10);
        if (!isNaN(codeNumber)) {
          const budgets = await this.prisma.$queryRaw<SearchResultBudget[]>`
            SELECT
              b.id,
              b.code,
              b.status,
              b.total,
              b."createdAt",
              json_build_object(
                'name', c.name,
                'phone', c.phone
              ) as client,
              1.0 as rank
            FROM budgets b
            INNER JOIN clients c ON c.id = b."clientId"
            WHERE b."organizationId" = ${organizationId}
              AND b."deletedAt" IS NULL
              AND b.code = ${codeNumber}
            LIMIT ${limit}
          `;
          results.budgets = budgets;
          results.totalBudgets = budgets.length;
        }
      } else {
        // Search in client name and phone (exclude code when # is not present)
        // Use Full-Text Search OR partial match for name/phone
        const searchPattern = `%${searchQuery}%`;
        const budgets = await this.prisma.$queryRaw<SearchResultBudget[]>`
          SELECT
            b.id,
            b.code,
            b.status,
            b.total,
            b."createdAt",
            json_build_object(
              'name', c.name,
              'phone', c.phone
            ) as client,
            CASE
              WHEN b.search_vector @@ plainto_tsquery('portuguese', ${searchQuery})
                THEN ts_rank(b.search_vector, plainto_tsquery('portuguese', ${searchQuery}))
              ELSE 0.5
            END as rank
          FROM budgets b
          INNER JOIN clients c ON c.id = b."clientId"
          WHERE b."organizationId" = ${organizationId}
            AND b."deletedAt" IS NULL
            AND (
              b.search_vector @@ plainto_tsquery('portuguese', ${searchQuery})
              OR c.name ILIKE ${searchPattern}
              OR c.phone ILIKE ${searchPattern}
            )
          ORDER BY rank DESC, b."createdAt" DESC
          LIMIT ${limit}
        `;
        results.budgets = budgets;
        results.totalBudgets = budgets.length;
      }
    }

    // Search cards (only when # prefix is NOT present)
    if (types.includes('cards') && !isCodeSearch) {
      // Use Full-Text Search OR partial match for title/description
      const searchPattern = `%${searchQuery}%`;
      const cards = await this.prisma.$queryRaw<SearchResultCard[]>`
        SELECT
          ca.id,
          ca.title,
          ca.description,
          ca.priority,
          ca."dueDate",
          json_build_object(
            'title', col.title,
            'board', json_build_object(
              'title', b.title
            )
          ) as column,
          CASE
            WHEN ca.search_vector @@ plainto_tsquery('portuguese', ${searchQuery})
              THEN ts_rank(ca.search_vector, plainto_tsquery('portuguese', ${searchQuery}))
            ELSE 0.5
          END as rank
        FROM cards ca
        INNER JOIN board_columns col ON col.id = ca."columnId"
        INNER JOIN boards b ON b.id = col."boardId"
        WHERE b."organizationId" = ${organizationId}
          AND (
            ca.search_vector @@ plainto_tsquery('portuguese', ${searchQuery})
            OR ca.title ILIKE ${searchPattern}
            OR ca.description ILIKE ${searchPattern}
          )
        ORDER BY rank DESC, ca."createdAt" DESC
        LIMIT ${limit}
      `;
      results.cards = cards;
      results.totalCards = cards.length;
    }

    return results;
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}
