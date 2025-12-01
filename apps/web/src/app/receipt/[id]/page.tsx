import { redirect } from 'next/navigation';

import { getBudget } from '@/app/http/requests/budgets';

import { ReceiptPageClient } from './receipt-page-client';

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getBudget(id);
  const budget = data?.budget;

  if (!budget) {
    redirect('/finance/budgets');
  }

  // Only allow printing receipts for accepted budgets
  if (budget.status !== 'ACCEPTED') {
    redirect(`/finance/budgets/${id}`);
  }

  return <ReceiptPageClient budget={budget} />;
}
