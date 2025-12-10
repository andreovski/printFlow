import { Budget, BudgetStatus, DiscountType } from '@prisma/client';
import { randomUUID } from 'crypto';

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
          ...(budgetData.status === 'ACCEPTED'
            ? { approvedAt: new Date() }
            : budgetData.status && budgetData.status !== 'INACTIVE'
              ? { approvedAt: null }
              : {}),
        },
        budgetItemsData
      );
    } else {
      // Handle approvedAt based on status change
      let approvedAt: Date | null | undefined;
      if (budgetData.status) {
        if (budgetData.status === 'ACCEPTED') {
          approvedAt = new Date();
        } else if (budgetData.status !== 'INACTIVE') {
          approvedAt = null;
        }
      }

      // Se apenas tagIds foi passado (sem items), atualizar normalmente
      if (tagIds !== undefined) {
        return await this.budgetsRepository.update(id, {
          ...budgetData,
          ...(approvedAt !== undefined && { approvedAt }),
          tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
        });
      }
      return await this.budgetsRepository.update(id, {
        ...budgetData,
        ...(approvedAt !== undefined && { approvedAt }),
      });
    }
  }

  /**
   * Optimized update - doesn't load relations after update
   * Use when you don't need the full budget data returned
   */
  async updateOptimized(
    id: string,
    data: UpdateBudgetDTO
  ): Promise<{ id: string; code: number; status: string }> {
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

      return await this.budgetsRepository.updateWithItemsOptimized(
        id,
        {
          ...budgetData,
          tagIds,
          subtotal,
          total,
          ...(budgetData.status === 'ACCEPTED'
            ? { approvedAt: new Date() }
            : budgetData.status && budgetData.status !== 'INACTIVE'
              ? { approvedAt: null }
              : {}),
        },
        budgetItemsData
      );
    } else {
      // Handle approvedAt based on status change
      let approvedAt: Date | null | undefined;
      if (budgetData.status) {
        if (budgetData.status === 'ACCEPTED') {
          approvedAt = new Date();
        } else if (budgetData.status !== 'INACTIVE') {
          approvedAt = null;
        }
      }

      // Se apenas tagIds foi passado (sem items), atualizar normalmente
      if (tagIds !== undefined) {
        return await this.budgetsRepository.updateOptimized(id, {
          ...budgetData,
          ...(approvedAt !== undefined && { approvedAt }),
          tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
        });
      }
      return await this.budgetsRepository.updateOptimized(id, {
        ...budgetData,
        ...(approvedAt !== undefined && { approvedAt }),
      });
    }
  }

  async updateStatus(id: string, status: BudgetStatus): Promise<Budget> {
    let approvedAt: Date | null | undefined;
    if (status === 'ACCEPTED') {
      approvedAt = new Date();
    } else if (status !== 'INACTIVE') {
      approvedAt = null;
    }

    return await this.budgetsRepository.update(id, {
      status,
      ...(approvedAt !== undefined && { approvedAt }),
    });
  }

  /**
   * Optimized status update - doesn't load relations
   * Use this when you don't need the full budget after update
   */
  async updateStatusOptimized(
    id: string,
    status: BudgetStatus
  ): Promise<{ id: string; status: string; code: number }> {
    let approvedAt: Date | null | undefined;
    if (status === 'ACCEPTED') {
      approvedAt = new Date();
    } else if (status !== 'INACTIVE') {
      approvedAt = null;
    }

    return await this.budgetsRepository.updateStatusOnly(id, status, approvedAt);
  }

  /**
   * Check if budget exists without loading all data
   */
  async exists(id: string): Promise<boolean> {
    return await this.budgetsRepository.exists(id);
  }

  /**
   * Get only the budget status - optimized for status checks
   */
  async findStatusById(id: string): Promise<{ id: string; status: string } | null> {
    return await this.budgetsRepository.findStatusById(id);
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

  // Public approval link methods
  async generateApprovalToken(id: string): Promise<{ token: string; expiresAt: Date | null }> {
    const budget = await this.budgetsRepository.findById(id);
    if (!budget) {
      throw new Error('Budget not found');
    }

    if (budget.status !== 'SENT') {
      throw new Error('Cannot generate approval link for budget that is not SENT');
    }

    // Generate unique token
    const token = randomUUID() + randomUUID().replace(/-/g, '');

    await this.budgetsRepository.setApprovalToken(id, token);

    return {
      token,
      expiresAt: budget.expirationDate,
    };
  }

  async findByApprovalToken(token: string) {
    return this.budgetsRepository.findByApprovalToken(token);
  }

  async approveByClient(id: string): Promise<Budget> {
    return this.budgetsRepository.approveByClient(id);
  }

  async rejectByClient(id: string, reason?: string): Promise<Budget> {
    return this.budgetsRepository.rejectByClient(id, reason);
  }
}
