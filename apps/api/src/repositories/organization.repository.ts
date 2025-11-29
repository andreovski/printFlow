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
        // Company Information
        cnpj: true,
        enterpriseName: true,
        fantasyName: true,
        mainEmail: true,
        mainPhone: true,
        // Address
        cep: true,
        address: true,
        addressNumber: true,
        complement: true,
        neighborhood: true,
        city: true,
        state: true,
        country: true,
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
      // Company Information
      cnpj?: string;
      enterpriseName?: string;
      fantasyName?: string;
      mainEmail?: string;
      mainPhone?: string;
      // Address
      cep?: string;
      address?: string;
      addressNumber?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      country?: string;
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
