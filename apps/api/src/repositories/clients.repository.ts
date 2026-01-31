import { Prisma, Client } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export class ClientsRepository {
  async create(data: Prisma.ClientCreateInput): Promise<Client> {
    const client = await prisma.client.create({
      data,
    });
    return client;
  }

  async findMany(
    organizationId: string,
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ): Promise<{ data: Client[]; total: number }> {
    const skip = (page - 1) * pageSize;

    // Normalizar documento removendo caracteres não-numéricos
    const normalizedSearch = search ? search.replaceAll(/\D/g, '') : undefined;

    const where: Prisma.ClientWhereInput = {
      organizationId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { document: { contains: search } },
              ...(normalizedSearch && normalizedSearch.length >= 11
                ? [{ document: { equals: normalizedSearch } }]
                : []),
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: pageSize,
      }),
      prisma.client.count({
        where,
      }),
    ]);

    return { data, total };
  }

  async findById(id: string): Promise<Client | null> {
    const client = await prisma.client.findUnique({
      where: {
        id,
      },
    });
    return client;
  }

  async update(id: string, data: Prisma.ClientUpdateInput): Promise<Client> {
    const client = await prisma.client.update({
      where: { id },
      data,
    });
    return client;
  }

  async findByCpf(cpf: string, organizationId: string): Promise<Client | null> {
    const client = await prisma.client.findUnique({
      where: {
        document_organizationId: {
          document: cpf,
          organizationId,
        },
      },
    });
    return client;
  }

  async delete(id: string): Promise<void> {
    await prisma.client.delete({ where: { id } });
  }
}
