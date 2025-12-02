import { OrganizationRepository } from '@/repositories/organization.repository';
import { UsersRepository } from '@/repositories/users.repository';

interface CreateOrganizationData {
  name: string;
  cnpj?: string;
  enterpriseName?: string;
  mainEmail: string;
  mainPhone: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  country?: string;
}

export class OrganizationService {
  constructor(
    private organizationRepository: OrganizationRepository,
    private usersRepository: UsersRepository
  ) {}

  async createOrganization(userId: string, data: CreateOrganizationData) {
    // Verificar se usuário já possui uma organização
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (user.organizationId) {
      throw new Error('User already has an organization.');
    }

    // Criar organização com o usuário como owner
    const organization = await this.organizationRepository.create({
      name: data.name,
      ownerId: userId,
      fantasyName: data.name, // Replicar valor conforme requisito
      cnpj: data.cnpj,
      enterpriseName: data.enterpriseName,
      mainEmail: data.mainEmail,
      mainPhone: data.mainPhone,
      cep: data.cep,
      address: data.address,
      addressNumber: data.number,
      complement: data.complement,
      city: data.city,
      state: data.state,
      country: data.country || 'Brasil',
    });

    // Vincular usuário à organização e definir como MASTER
    await this.usersRepository.update(userId, {
      organization: {
        connect: { id: organization.id },
      },
      role: 'MASTER',
    });

    return { organization };
  }
}
