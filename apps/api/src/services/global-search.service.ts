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

interface SearchResultClient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  document: string;
  active: boolean;
  rank: number;
}

interface SearchResultProduct {
  id: string;
  title: string;
  code: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  active: boolean;
  rank: number;
}

export interface GlobalSearchResult {
  budgets: SearchResultBudget[];
  cards: SearchResultCard[];
  clients: SearchResultClient[];
  products: SearchResultProduct[];
  totalBudgets: number;
  totalCards: number;
  totalClients: number;
  totalProducts: number;
}

interface SearchOptions {
  query: string;
  organizationId: string;
  types?: ('budgets' | 'cards' | 'clients' | 'products')[];
  limit?: number;
}

export class GlobalSearchService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async search(options: SearchOptions): Promise<GlobalSearchResult> {
    const {
      query,
      organizationId,
      types = ['budgets', 'cards', 'clients', 'products'],
      limit = 25,
    } = options;

    // Minimum query length validation
    if (query.trim().length < 3) {
      return {
        budgets: [],
        cards: [],
        clients: [],
        products: [],
        totalBudgets: 0,
        totalCards: 0,
        totalClients: 0,
        totalProducts: 0,
      };
    }

    // Detect search prefixes
    const isCodeSearch = query.trim().startsWith('#');
    const isClientSearch = query.trim().startsWith('@');
    const isProductSearch = query.trim().startsWith('$');

    const searchQuery =
      isCodeSearch || isClientSearch || isProductSearch ? query.trim().substring(1) : query.trim();

    const results: GlobalSearchResult = {
      budgets: [],
      cards: [],
      clients: [],
      products: [],
      totalBudgets: 0,
      totalCards: 0,
      totalClients: 0,
      totalProducts: 0,
    };

    // Search budgets (only when not using @ or $ prefixes)
    if (types.includes('budgets') && !isClientSearch && !isProductSearch) {
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

    // Search cards (only when no special prefix is present)
    if (types.includes('cards') && !isCodeSearch && !isClientSearch && !isProductSearch) {
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

    // Search clients (only when @ prefix is present)
    if (types.includes('clients') && isClientSearch) {
      const searchPattern = `%${searchQuery}%`;
      const clients = await this.prisma.$queryRaw<SearchResultClient[]>`
        SELECT
          c.id,
          c.name,
          c.phone,
          c.email,
          c.document,
          c.active,
          CASE
            WHEN c.search_vector @@ plainto_tsquery('portuguese', ${searchQuery})
              THEN ts_rank(c.search_vector, plainto_tsquery('portuguese', ${searchQuery}))
            ELSE 0.5
          END as rank
        FROM clients c
        WHERE c."organizationId" = ${organizationId}
          AND (
            c.search_vector @@ plainto_tsquery('portuguese', ${searchQuery})
            OR c.name ILIKE ${searchPattern}
            OR c.phone ILIKE ${searchPattern}
            OR c.document ILIKE ${searchPattern}
            OR c.email ILIKE ${searchPattern}
          )
        ORDER BY rank DESC, c."createdAt" DESC
        LIMIT ${limit}
      `;
      results.clients = clients;
      results.totalClients = clients.length;
    }

    // Search products (only when $ prefix is present)
    if (types.includes('products') && isProductSearch) {
      const searchPattern = `%${searchQuery}%`;
      const products = await this.prisma.$queryRaw<SearchResultProduct[]>`
        SELECT
          p.id,
          p.title,
          p.code,
          p."costPrice"::numeric as "costPrice",
          p."salePrice"::numeric as "salePrice",
          p.stock,
          p.active,
          CASE
            WHEN p.search_vector @@ plainto_tsquery('portuguese', ${searchQuery})
              THEN ts_rank(p.search_vector, plainto_tsquery('portuguese', ${searchQuery}))
            ELSE 0.5
          END as rank
        FROM products p
        WHERE p."organizationId" = ${organizationId}
          AND (
            p.search_vector @@ plainto_tsquery('portuguese', ${searchQuery})
            OR p.title ILIKE ${searchPattern}
            OR p.code ILIKE ${searchPattern}
          )
        ORDER BY rank DESC, p."createdAt" DESC
        LIMIT ${limit}
      `;
      results.products = products;
      results.totalProducts = products.length;
    }

    return results;
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}
