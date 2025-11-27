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
        budgetAutoInactive: true,
        budgetAutoArchive: true,
        budgetShowTotalInKanban: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    return organization;
  }

  async update(
    id: string,
    data: {
      budgetAutoInactive?: boolean;
      budgetAutoArchive?: boolean;
      budgetShowTotalInKanban?: boolean;
    }
  ) {
    const organization = await prisma.organization.update({
      where: {
        id,
      },
      data,
    });

    return organization;
  }
}
