'use server';

import { revalidateTag } from 'next/cache';

import {
  createBudget,
  updateBudget,
  deleteBudget,
  archiveBudget,
} from '@/app/http/requests/budgets';

export async function createBudgetAction(data: any) {
  try {
    const payload = {
      ...data,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      items: data.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        discountType: i.discountType || null,
        discountValue: i.discountValue || null,
      })),
    };

    await createBudget(payload);
    revalidateTag('budgets');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create budget');
  }
}

export async function updateBudgetAction(id: string, data: any) {
  try {
    const payload = {
      ...data,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      items: data.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        discountType: i.discountType || null,
        discountValue: i.discountValue || null,
      })),
    };

    await updateBudget(id, payload);
    revalidateTag('budgets');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update budget');
  }
}

export async function deleteBudgetAction(id: string) {
  try {
    await deleteBudget(id);
    revalidateTag('budgets');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete budget');
  }
}

export async function duplicateBudgetAction(data: any) {
  try {
    const payload = {
      ...data,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      status: 'DRAFT', // Always set status to DRAFT for duplicated budgets
      items: data.items.map((i: any) => ({
        productId: i.productId,
        quantity: i.quantity,
        discountType: i.discountType || null,
        discountValue: i.discountValue || null,
      })),
    };

    await createBudget(payload);
    revalidateTag('budgets');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to duplicate budget');
  }
}

export async function archiveBudgetAction(id: string) {
  try {
    await archiveBudget(id);
    revalidateTag('budgets');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to archive budget');
  }
}
