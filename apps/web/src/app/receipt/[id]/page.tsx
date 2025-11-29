import { redirect } from 'next/navigation';

import { getBudget } from '@/app/http/requests/budgets';

import { ReceiptPageClient } from './receipt-page-client';

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const data = await getBudget(params.id);
  const budget = data?.budget;

  if (!budget) {
    redirect('/finance/budgets');
  }

  // Only allow printing receipts for accepted budgets
  if (budget.status !== 'ACCEPTED') {
    redirect(`/finance/budgets/${params.id}`);
  }

  return <ReceiptPageClient budget={budget} />;
}
