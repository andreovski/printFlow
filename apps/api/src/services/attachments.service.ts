import { Attachment } from '@prisma/client';

import { AttachmentsRepository, CreateAttachmentDTO } from '@/repositories/attachments.repository';

interface CreateAttachmentInput {
  name: string;
  url: string;
  key: string;
  size: number;
  mimeType?: string | null;
  organizationId: string;
  budgetId?: string | null;
  cardId?: string | null;
}

interface CreateManyAttachmentsInput {
  attachments: Omit<CreateAttachmentInput, 'organizationId'>[];
  organizationId: string;
  budgetId?: string | null;
  cardId?: string | null;
}

export class AttachmentsService {
  private attachmentsRepository: AttachmentsRepository;

  constructor() {
    this.attachmentsRepository = new AttachmentsRepository();
  }

  async create(data: CreateAttachmentInput): Promise<Attachment> {
    // Validar que pertence a Budget OU Card, não ambos
    if (data.budgetId && data.cardId) {
      throw new Error('Attachment cannot belong to both Budget and Card');
    }

    if (!data.budgetId && !data.cardId) {
      throw new Error('Attachment must belong to either a Budget or a Card');
    }

    return await this.attachmentsRepository.create(data);
  }

  async createMany(data: CreateManyAttachmentsInput): Promise<{ count: number }> {
    const { attachments, organizationId, budgetId, cardId } = data;

    // Validar que pertence a Budget OU Card, não ambos
    if (budgetId && cardId) {
      throw new Error('Attachments cannot belong to both Budget and Card');
    }

    if (!budgetId && !cardId) {
      throw new Error('Attachments must belong to either a Budget or a Card');
    }

    const attachmentsData: CreateAttachmentDTO[] = attachments.map((att) => ({
      ...att,
      organizationId,
      budgetId: budgetId || null,
      cardId: cardId || null,
    }));

    const result = await this.attachmentsRepository.createMany(attachmentsData);
    return { count: result.count };
  }

  async findById(id: string): Promise<Attachment | null> {
    return await this.attachmentsRepository.findById(id);
  }

  async findByBudgetId(budgetId: string): Promise<Attachment[]> {
    return await this.attachmentsRepository.findByBudgetId(budgetId);
  }

  async findByCardId(cardId: string): Promise<Attachment[]> {
    return await this.attachmentsRepository.findByCardId(cardId);
  }

  async delete(id: string, organizationId: string): Promise<Attachment> {
    const attachment = await this.attachmentsRepository.findById(id);

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    if (attachment.organizationId !== organizationId) {
      throw new Error('Attachment does not belong to this organization');
    }

    // Só deletar do storage se NÃO for uma referência (cópia do budget)
    // Se sourceBudgetAttachmentId estiver preenchido, é uma referência
    if (!attachment.sourceBudgetAttachmentId) {
      // Aqui você pode chamar o serviço de storage para deletar o arquivo
      // await this.deleteFromStorage(attachment.key);
    }

    return await this.attachmentsRepository.delete(id);
  }

  async deleteByKey(key: string, organizationId: string): Promise<Attachment> {
    const attachment = await this.attachmentsRepository.findByKey(key);

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    if (attachment.organizationId !== organizationId) {
      throw new Error('Attachment does not belong to this organization');
    }

    // Aqui você pode chamar o serviço de storage para deletar o arquivo
    // await this.deleteFromStorage(key);

    return await this.attachmentsRepository.deleteByKey(key);
  }

  // Método para deletar todos os anexos de um budget
  async deleteAllByBudgetId(budgetId: string): Promise<{ count: number }> {
    // Primeiro, buscar todos os anexos para deletar do storage
    const _attachments = await this.attachmentsRepository.findByBudgetId(budgetId);

    // Deletar do storage (implementar quando integrar com UploadThing)
    // for (const attachment of attachments) {
    //   await this.deleteFromStorage(attachment.key);
    // }

    const result = await this.attachmentsRepository.deleteByBudgetId(budgetId);
    return { count: result.count };
  }

  // Método para deletar todos os anexos de um card
  async deleteAllByCardId(cardId: string): Promise<{ count: number }> {
    // Primeiro, buscar todos os anexos para deletar do storage
    const _attachments = await this.attachmentsRepository.findByCardId(cardId);

    // Deletar do storage (implementar quando integrar com UploadThing)
    // for (const attachment of attachments) {
    //   await this.deleteFromStorage(attachment.key);
    // }

    const result = await this.attachmentsRepository.deleteByCardId(cardId);
    return { count: result.count };
  }
}
