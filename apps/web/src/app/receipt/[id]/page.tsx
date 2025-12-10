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

  // Fetch organization data to ensure it's available in the new tab/window
  const { getOrganization } = await import('@/app/http/requests/organization');
  const orgData = await getOrganization();
  const organization = orgData?.organization;

  return <ReceiptPageClient budget={budget} organization={organization} />;
}
