import { PublicBudgetResponse } from '@magic-system/schemas';
import ky from 'ky';

// Create a public API client without authentication
const publicApi = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getPublicBudget(token: string): Promise<PublicBudgetResponse> {
  return publicApi.get(`public/budgets/${token}`).json<PublicBudgetResponse>();
}

export async function approvePublicBudget(
  token: string
): Promise<{ message: string; budget: { id: string; code: number; status: string } }> {
  return publicApi.post(`public/budgets/${token}/approve`, { json: {} }).json();
}

export async function rejectPublicBudget(
  token: string,
  reason?: string
): Promise<{ message: string; budget: { id: string; code: number; status: string } }> {
  return publicApi.post(`public/budgets/${token}/reject`, { json: { reason } }).json();
}
