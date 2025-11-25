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
    pageSize: number = 10
  ): Promise<{ data: Client[]; total: number }> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where: {
          organizationId,
        },
        skip,
        take: pageSize,
      }),
      prisma.client.count({
        where: {
          organizationId,
        },
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

  async findByCpf(cpf: string): Promise<Client | null> {
    const client = await prisma.client.findUnique({
      where: {
        document: cpf,
      },
    });
    return client;
  }

  async delete(id: string): Promise<void> {
    await prisma.client.delete({ where: { id } });
  }
}
