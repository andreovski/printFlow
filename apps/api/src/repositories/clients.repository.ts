import { prisma } from '@/lib/prisma';
import { Prisma, Client } from '@prisma/client';

export class ClientsRepository {
  async create(data: Prisma.ClientCreateInput): Promise<Client> {
    const client = await prisma.client.create({
      data,
    });
    return client;
  }

  async findMany(organizationId: string): Promise<Client[]> {
    const clients = await prisma.client.findMany({
      where: {
        organizationId,
      },
    });
    return clients;
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
