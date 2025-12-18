'use client';

import { CheckCircle, Clock, DollarSign, Loader2 } from 'lucide-react';

import { useAccountsPayableKPIs } from '@/app/http/hooks/use-accounts-payable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardKPIsProps {
  startDate?: Date;
  endDate?: Date;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function KPICard({ title, value, icon, isLoading }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardKPIs({ startDate, endDate }: DashboardKPIsProps) {
  const { data, isLoading } = useAccountsPayableKPIs({ startDate, endDate }, { enabled: true });

  const kpis = data?.kpis ?? {
    totalToPay: 0,
    totalPaid: 0,
    totalPending: 0,
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KPICard
        title="Total a Pagar"
        value={formatCurrency(kpis.totalToPay)}
        icon={<DollarSign className="h-4 w-4 text-orange-600" />}
        isLoading={isLoading}
      />
      <KPICard
        title="Total Pago"
        value={formatCurrency(kpis.totalPaid)}
        icon={<CheckCircle className="h-4 w-4 text-green-600" />}
        isLoading={isLoading}
      />
      <KPICard
        title="Total Pendente"
        value={formatCurrency(kpis.totalPending)}
        icon={<Clock className="h-4 w-4 text-yellow-600" />}
        isLoading={isLoading}
      />
    </div>
  );
}
