import { Budget, BudgetStatus, DiscountType } from '@prisma/client';
import { randomUUID } from 'crypto';

import { BudgetsRepository } from '@/repositories/budgets.repository';
import { ProductsRepository } from '@/repositories/products.repository';

interface CreateBudgetItemDTO {
  productId: string;
  quantity: number;
  width?: number | null;
  height?: number | null;
  discountType?: 'PERCENT' | 'VALUE' | null;
  discountValue?: number | null;
}

interface CreateBudgetDTO {
  organizationId: string;
  clientId: string;
  expirationDate?: Date | null;
  discountType?: 'PERCENT' | 'VALUE' | null;
  discountValue?: number | null;
  surchargeType?: 'PERCENT' | 'VALUE' | null;
  surchargeValue?: number | null;
  advancePayment?: number | null;
  notes?: string | null;
  tagIds?: string[];
  isPaidInFull?: boolean;
  items: CreateBudgetItemDTO[];
}

interface UpdateBudgetDTO {
  status?: BudgetStatus;
  expirationDate?: Date | null;
  discountType?: 'PERCENT' | 'VALUE' | null;
  discountValue?: number | null;
  surchargeType?: 'PERCENT' | 'VALUE' | null;
  surchargeValue?: number | null;
  advancePayment?: number | null;
  notes?: string | null;
  tagIds?: string[];
  items?: CreateBudgetItemDTO[];
  isPaidInFull?: boolean;
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
    const { items, tagIds, isPaidInFull, ...budgetData } = data;

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
      const costPrice = Number(product.costPrice);
      const quantity = item.quantity;

      // Calcular total com base no tipo de unidade
      let itemTotal: number;
      if (product.unitType === 'M2' && item.width && item.height) {
        const area = item.width * item.height; // width e height em metros
        itemTotal = area * (salePrice * quantity);
      } else {
        itemTotal = salePrice * quantity;
      }

      if (item.discountType === 'PERCENT' && item.discountValue) {
        itemTotal -= itemTotal * (item.discountValue / 100);
      } else if (item.discountType === 'VALUE' && item.discountValue) {
        itemTotal -= item.discountValue;
      }

      subtotal += itemTotal;

      return {
        productId: item.productId,
        name: product.title, // Snapshot
        costPrice: costPrice, // Snapshot
        salePrice: salePrice,
        quantity: item.quantity,
        width: item.width || null,
        height: item.height || null,
        unitType: product.unitType,
        discountType: item.discountType,
        discountValue: item.discountValue,
        total: itemTotal,
      };
    });

    let total = subtotal;
    // Aplicar acréscimo global
    if (budgetData.surchargeType === 'PERCENT' && budgetData.surchargeValue) {
      total += total * (budgetData.surchargeValue / 100);
    } else if (budgetData.surchargeType === 'VALUE' && budgetData.surchargeValue) {
      total += budgetData.surchargeValue;
    }
    // Aplicar desconto global
    if (budgetData.discountType === 'PERCENT' && budgetData.discountValue) {
      total -= total * (budgetData.discountValue / 100);
    } else if (budgetData.discountType === 'VALUE' && budgetData.discountValue) {
      total -= budgetData.discountValue;
    }
    if (budgetData.advancePayment) {
      total -= budgetData.advancePayment;
    }

    // Se estiver pago totalmente, zera o total
    if (isPaidInFull) {
      total = 0;
    }

    return await this.budgetsRepository.create({
      ...budgetData,
      status: 'DRAFT',
      subtotal,
      total,
      isPaidInFull: isPaidInFull || false,
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
        const costPrice = Number(product.costPrice);
        const quantity = item.quantity;

        // Calcular total com base no tipo de unidade
        let itemTotal: number;
        if (product.unitType === 'M2' && item.width && item.height) {
          const area = item.width * item.height; // width e height em metros
          itemTotal = area * (salePrice * quantity);
        } else {
          itemTotal = salePrice * quantity;
        }

        if (item.discountType === 'PERCENT' && item.discountValue) {
          itemTotal -= itemTotal * (item.discountValue / 100);
        } else if (item.discountType === 'VALUE' && item.discountValue) {
          itemTotal -= item.discountValue;
        }

        subtotal += itemTotal;

        return {
          productId: item.productId,
          name: product.title,
          costPrice: costPrice,
          salePrice: salePrice,
          quantity: item.quantity,
          width: item.width || null,
          height: item.height || null,
          unitType: product.unitType,
          discountType: item.discountType,
          discountValue: item.discountValue,
          total: itemTotal,
        };
      });

      let globalDiscountType = budgetData.discountType;
      let globalDiscountValue = budgetData.discountValue;
      let globalSurchargeType = budgetData.surchargeType;
      let globalSurchargeValue = budgetData.surchargeValue;
      let isPaidInFull = budgetData.isPaidInFull;

      // If not provided in update, fetch from DB to calculate total correctly
      if (
        globalDiscountType === undefined ||
        globalDiscountValue === undefined ||
        globalSurchargeType === undefined ||
        globalSurchargeValue === undefined ||
        isPaidInFull === undefined
      ) {
        const currentBudget = await this.budgetsRepository.findById(id);
        if (currentBudget) {
          if (globalDiscountType === undefined)
            globalDiscountType = currentBudget.discountType as DiscountType;
          if (globalDiscountValue === undefined)
            globalDiscountValue = Number(currentBudget.discountValue);
          if (globalSurchargeType === undefined)
            globalSurchargeType = currentBudget.surchargeType as DiscountType;
          if (globalSurchargeValue === undefined)
            globalSurchargeValue = Number(currentBudget.surchargeValue);
          if (isPaidInFull === undefined) isPaidInFull = currentBudget.isPaidInFull;
        }
      }

      let total = subtotal;
      // Aplicar acréscimo global
      if (globalSurchargeType === 'PERCENT' && globalSurchargeValue) {
        total += total * (globalSurchargeValue / 100);
      } else if (globalSurchargeType === 'VALUE' && globalSurchargeValue) {
        total += globalSurchargeValue;
      }
      // Aplicar desconto global
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

      if (isPaidInFull) {
        total = 0;
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
      // Logic for update WITHOUT items (potentially just changing payment status or other fields)
      let needsRecalculation = false;
      const fieldsAffectingTotal = [
        'discountType',
        'discountValue',
        'surchargeType',
        'surchargeValue',
        'advancePayment',
        'isPaidInFull',
      ];

      // Check if any field affecting total is present
      for (const field of fieldsAffectingTotal) {
        if (field in budgetData) {
          needsRecalculation = true;
          break;
        }
      }

      let total: number | undefined;

      if (needsRecalculation) {
        const currentBudget = await this.budgetsRepository.findById(id);
        if (currentBudget) {
          const subtotal = Number(currentBudget.subtotal);
          const globalDiscountType =
            budgetData.discountType !== undefined
              ? budgetData.discountType
              : (currentBudget.discountType as DiscountType);
          const globalDiscountValue =
            budgetData.discountValue !== undefined
              ? budgetData.discountValue
              : Number(currentBudget.discountValue);
          const globalSurchargeType =
            budgetData.surchargeType !== undefined
              ? budgetData.surchargeType
              : (currentBudget.surchargeType as DiscountType);
          const globalSurchargeValue =
            budgetData.surchargeValue !== undefined
              ? budgetData.surchargeValue
              : Number(currentBudget.surchargeValue);
          const advancePayment =
            budgetData.advancePayment !== undefined
              ? budgetData.advancePayment
              : Number(currentBudget.advancePayment);
          const isPaidInFull =
            budgetData.isPaidInFull !== undefined
              ? budgetData.isPaidInFull
              : currentBudget.isPaidInFull;

          total = subtotal;

          // Recalculate based on (maybe) new values
          if (globalSurchargeType === 'PERCENT' && globalSurchargeValue) {
            total += total * (globalSurchargeValue / 100);
          } else if (globalSurchargeType === 'VALUE' && globalSurchargeValue) {
            total += globalSurchargeValue;
          }
          if (globalDiscountType === 'PERCENT' && globalDiscountValue) {
            total -= total * (globalDiscountValue / 100);
          } else if (globalDiscountType === 'VALUE' && globalDiscountValue) {
            total -= globalDiscountValue;
          }

          if (advancePayment) {
            total -= advancePayment;
          }

          if (isPaidInFull) {
            total = 0;
          }
        }
      }

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
          ...(total !== undefined && { total }),
          ...(approvedAt !== undefined && { approvedAt }),
          tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
        });
      }
      return await this.budgetsRepository.update(id, {
        ...budgetData,
        ...(total !== undefined && { total }),
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
        const costPrice = Number(product.costPrice);
        const quantity = item.quantity;

        // Calcular total com base no tipo de unidade
        let itemTotal: number;
        if (product.unitType === 'M2' && item.width && item.height) {
          const area = item.width * item.height; // width e height em metros
          itemTotal = area * (salePrice * quantity);
        } else {
          itemTotal = salePrice * quantity;
        }

        if (item.discountType === 'PERCENT' && item.discountValue) {
          itemTotal -= itemTotal * (item.discountValue / 100);
        } else if (item.discountType === 'VALUE' && item.discountValue) {
          itemTotal -= item.discountValue;
        }

        subtotal += itemTotal;

        return {
          productId: item.productId,
          name: product.title,
          costPrice: costPrice,
          salePrice: salePrice,
          quantity: item.quantity,
          width: item.width || null,
          height: item.height || null,
          unitType: product.unitType,
          discountType: item.discountType,
          discountValue: item.discountValue,
          total: itemTotal,
        };
      });

      let globalDiscountType = budgetData.discountType;
      let globalDiscountValue = budgetData.discountValue;
      let globalSurchargeType = budgetData.surchargeType;
      let globalSurchargeValue = budgetData.surchargeValue;
      let isPaidInFull = budgetData.isPaidInFull;

      // If not provided in update, fetch from DB to calculate total correctly
      if (
        globalDiscountType === undefined ||
        globalDiscountValue === undefined ||
        globalSurchargeType === undefined ||
        globalSurchargeValue === undefined ||
        isPaidInFull === undefined
      ) {
        const currentBudget = await this.budgetsRepository.findById(id);
        if (currentBudget) {
          if (globalDiscountType === undefined)
            globalDiscountType = currentBudget.discountType as DiscountType;
          if (globalDiscountValue === undefined)
            globalDiscountValue = Number(currentBudget.discountValue);
          if (globalSurchargeType === undefined)
            globalSurchargeType = currentBudget.surchargeType as DiscountType;
          if (globalSurchargeValue === undefined)
            globalSurchargeValue = Number(currentBudget.surchargeValue);
          if (isPaidInFull === undefined) isPaidInFull = currentBudget.isPaidInFull;
        }
      }

      let total = subtotal;
      // Aplicar acréscimo global
      if (globalSurchargeType === 'PERCENT' && globalSurchargeValue) {
        total += total * (globalSurchargeValue / 100);
      } else if (globalSurchargeType === 'VALUE' && globalSurchargeValue) {
        total += globalSurchargeValue;
      }
      // Aplicar desconto global
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

      if (isPaidInFull) {
        total = 0;
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
      let needsRecalculation = false;
      const fieldsAffectingTotal = [
        'discountType',
        'discountValue',
        'surchargeType',
        'surchargeValue',
        'advancePayment',
        'isPaidInFull',
      ];

      // Check if any field affecting total is present
      for (const field of fieldsAffectingTotal) {
        if (field in budgetData) {
          needsRecalculation = true;
          break;
        }
      }

      let total: number | undefined;

      if (needsRecalculation) {
        const currentBudget = await this.budgetsRepository.findById(id);
        if (currentBudget) {
          const subtotal = Number(currentBudget.subtotal);
          const globalDiscountType =
            budgetData.discountType !== undefined
              ? budgetData.discountType
              : (currentBudget.discountType as DiscountType);
          const globalDiscountValue =
            budgetData.discountValue !== undefined
              ? budgetData.discountValue
              : Number(currentBudget.discountValue);
          const globalSurchargeType =
            budgetData.surchargeType !== undefined
              ? budgetData.surchargeType
              : (currentBudget.surchargeType as DiscountType);
          const globalSurchargeValue =
            budgetData.surchargeValue !== undefined
              ? budgetData.surchargeValue
              : Number(currentBudget.surchargeValue);
          const advancePayment =
            budgetData.advancePayment !== undefined
              ? budgetData.advancePayment
              : Number(currentBudget.advancePayment);
          const isPaidInFull =
            budgetData.isPaidInFull !== undefined
              ? budgetData.isPaidInFull
              : currentBudget.isPaidInFull;

          total = subtotal;

          // Recalculate based on (maybe) new values
          if (globalSurchargeType === 'PERCENT' && globalSurchargeValue) {
            total += total * (globalSurchargeValue / 100);
          } else if (globalSurchargeType === 'VALUE' && globalSurchargeValue) {
            total += globalSurchargeValue;
          }
          if (globalDiscountType === 'PERCENT' && globalDiscountValue) {
            total -= total * (globalDiscountValue / 100);
          } else if (globalDiscountType === 'VALUE' && globalDiscountValue) {
            total -= globalDiscountValue;
          }

          if (advancePayment) {
            total -= advancePayment;
          }

          if (isPaidInFull) {
            total = 0;
          }
        }
      }

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
          ...(total !== undefined && { total }),
          ...(approvedAt !== undefined && { approvedAt }),
          tags: { set: tagIds.map((tagId) => ({ id: tagId })) },
        });
      }
      return await this.budgetsRepository.updateOptimized(id, {
        ...budgetData,
        ...(total !== undefined && { total }),
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
