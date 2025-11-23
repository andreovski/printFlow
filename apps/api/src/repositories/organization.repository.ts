import { prisma } from '@/lib/prisma';

export class OrganizationRepository {
  constructor() {}

  async getOrganizationById(id: string) {
    const organization = await prisma.organization.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return organization;
  }
}
