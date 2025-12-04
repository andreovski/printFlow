import { cookies } from 'next/headers';

import { DashboardContent } from '@/components/dashboard/dashboard-content';

async function getMetrics(period: number = 30) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/metrics?period=${period}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      tags: ['metrics'],
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch metrics');
  }

  const data = await res.json();
  return data.metrics;
}

export default async function DashboardPage() {
  const {
    totalClients,
    totalProducts,
    totalBudgets,
    approvedBudgets,
    rejectedBudgets,
    sentBudgets,
    budgetsOverTime,
    clientsOverTime,
  } = await getMetrics();

  return (
    <DashboardContent
      initialMetrics={{
        totalClients,
        totalProducts,
        totalBudgets,
        approvedBudgets,
        rejectedBudgets,
        sentBudgets,
        budgetsOverTime,
        clientsOverTime,
      }}
    />
  );
}
