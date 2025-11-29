import { Budget, BudgetStatus, DiscountType } from '@prisma/client';

import { BudgetsRepository } from '@/repositories/budgets.repository';
import { ProductsRepository } from '@/repositories/products.repository';

interface CreateBudgetItemDTO {
  productId: string;
  quantity: number;
  discountType?: 'PERCENT' | 'VALUE' | null;
  discountValue?: number | null;
}

interface CreateBudgetDTO {
  organizationId: string;
  clientId: string;
  expirationDate?: Date | null;
  discountType?: 'PERCENT' | 'VALUE' | null;
  discountValue?: number | null;
  advancePayment?: number | null;
  notes?: string | null;
  tagIds?: string[];
  items: CreateBudgetItemDTO[];
}

interface UpdateBudgetDTO {
  status?: BudgetStatus;
  expirationDate?: Date | null;
  discountType?: 'PERCENT' | 'VALUE' | null;
  discountValue?: number | null;
  advancePayment?: number | null;
  notes?: string | null;
  tagIds?: string[];
  items?: CreateBudgetItemDTO[];
  archived?: boolean;
}

export class BudgetsService {
  private budgetsRepository: BudgetsRepository;
  private productsRepository: ProductsRepository;

  constructor() {
    this.budgetsRepository = new BudgetsRepository();
    this.productsRepository = new ProductsRepository();
  }

  async create(data: CreateBudgetDTO): Promise<Budget> {
    const { items, tagIds, ...budgetData } = data;

    // Fetch products to get snapshot data
    const productIds = items.map((i) => i.productId);
    const products = await this.productsRepository.findByIds(productIds);
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate totals
    let subtotal = 0;
    const budgetItemsData = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }

      const salePrice = Number(product.salePrice);
      const quantity = item.quantity;
      let itemTotal = salePrice * quantity;

      if (item.discountType === 'PERCENT' && item.discountValue) {
        itemTotal -= itemTotal * (item.discountValue / 100);
      } else if (item.discountType === 'VALUE' && item.discountValue) {
        itemTotal -= item.discountValue;
      }

      subtotal += itemTotal;

      return {
        productId: item.productId,
        name: product.title, // Snapshot
        costPrice: product.costPrice, // Snapshot
        salePrice: product.salePrice,
        quantity: item.quantity,
        discountType: item.discountType,
        discountValue: item.discountValue,
        total: itemTotal,
      };
    });

    let total = subtotal;
    if (budgetData.discountType === 'PERCENT' && budgetData.discountValue) {
      total -= total * (budgetData.discountValue / 100);
    } else if (budgetData.discountType === 'VALUE' && budgetData.discountValue) {
      total -= budgetData.discountValue;
    }
    if (budgetData.advancePayment) {
      total -= budgetData.advancePayment;
    }

    return await this.budgetsRepository.create({
      ...budgetData,
      status: 'DRAFT',
      subtotal,
      total,
      tags: tagIds?.length ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      items: {
        create: budgetItemsData,
      },
    });
  }

  async update(id: string, data: UpdateBudgetDTO): Promise<Budget> {
    const { items, tagIds, ...budgetData } = data;

    // If items are provided, we need to recalculate everything
    if (items) {
      const productIds = items.map((i) => i.productId);
      const products = await this.productsRepository.findByIds(productIds);
      const productMap = new Map(products.map((p) => [p.id, p]));

      let subtotal = 0;
      const budgetItemsData = items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        const salePrice = Number(product.salePrice);
        const quantity = item.quantity;
        let itemTotal = salePrice * quantity;

        if (item.discountType === 'PERCENT' && item.discountValue) {
          itemTotal -= itemTotal * (item.discountValue / 100);
        } else if (item.discountType === 'VALUE' && item.discountValue) {
          itemTotal -= item.discountValue;
        }

        subtotal += itemTotal;

        return {
          productId: item.productId,
          name: product.title,
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          quantity: item.quantity,
          discountType: item.discountType,
          discountValue: item.discountValue,
          total: itemTotal,
        };
      });

      let globalDiscountType = budgetData.discountType;
      let globalDiscountValue = budgetData.discountValue;

      // If not provided in update, fetch from DB to calculate total correctly
      if (globalDiscountType === undefined || globalDiscountValue === undefined) {
        const currentBudget = await this.budgetsRepository.findById(id);
        if (currentBudget) {
          if (globalDiscountType === undefined)
            globalDiscountType = currentBudget.discountType as DiscountType;
          if (globalDiscountValue === undefined)
            globalDiscountValue = Number(currentBudget.discountValue);
        }
      }

      let total = subtotal;
      if (globalDiscountType === 'PERCENT' && globalDiscountValue) {
        total -= total * (globalDiscountValue / 100);
      } else if (globalDiscountType === 'VALUE' && globalDiscountValue) {
        total -= globalDiscountValue;
      }

      // Handle advance payment
      let advancePayment = budgetData.advancePayment;
      if (advancePayment === undefined) {
        const currentBudget = await this.budgetsRepository.findById(id);
        if (currentBudget) {
          advancePayment = Number(currentBudget.advancePayment) || 0;
        }
      }
      if (advancePayment) {
        total -= advancePayment;
      }

      return await this.budgetsRepository.updateWithItems(
        id,
        {
          ...budgetData,
          tagIds,
          subtotal,
          total,
        },
        budgetItemsData
      );
    } else {
      // Se apenas tagIds foi passado (sem items), atualizar normalmente
      if (tagIds !== undefined) {
        return await this.budgetsRepository.update(id, {
          ...budgetData,
          tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
        });
      }
      return await this.budgetsRepository.update(id, budgetData);
    }
  }

  async updateStatus(id: string, status: BudgetStatus): Promise<Budget> {
    return await this.budgetsRepository.update(id, { status });
  }

  async findMany(organizationId: string, page: number = 1, pageSize: number = 10) {
    return this.budgetsRepository.findMany(organizationId, page, pageSize);
  }

  async findArchived(organizationId: string, page: number = 1, pageSize: number = 10) {
    return this.budgetsRepository.findArchived(organizationId, page, pageSize);
  }

  async findById(id: string) {
    return this.budgetsRepository.findById(id);
  }

  async delete(id: string) {
    return this.budgetsRepository.delete(id);
  }

  async archive(id: string) {
    return this.budgetsRepository.archive(id);
  }
}
