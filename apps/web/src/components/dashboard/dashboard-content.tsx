'use client';

import { Users, Package, FileText, CheckCircle, XCircle, Send } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { BudgetsChart } from './budgets-chart';
import { ClientsChart } from './clients-chart';
import { MetricCard } from './metric-card';

interface DashboardContentProps {
  initialMetrics: {
    totalClients: number;
    totalProducts: number;
    totalBudgets: number;
    approvedBudgets: number;
    rejectedBudgets: number;
    sentBudgets: number;
    budgetsOverTime: Array<{ month: string; count: number }>;
    clientsOverTime: Array<{ month: string; count: number }>;
  };
}

type Period = 7 | 15 | 30;

export function DashboardContent({ initialMetrics }: DashboardContentProps) {
  const [period, setPeriod] = useState<Period>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState(initialMetrics);

  const handlePeriodChange = async (newPeriod: Period) => {
    if (newPeriod === period) return;

    setIsLoading(true);
    setPeriod(newPeriod);

    try {
      const res = await fetch(`/api/metrics?period=${newPeriod}`);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant={period === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange(7)}
            disabled={isLoading}
          >
            7 dias
          </Button>
          <Button
            variant={period === 15 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange(15)}
            disabled={isLoading}
          >
            15 dias
          </Button>
          <Button
            variant={period === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange(30)}
            disabled={isLoading}
          >
            30 dias
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          title="Clientes Ativos"
          value={metrics.totalClients}
          description="Clientes ativos na sua organização"
          icon={Users}
        />
        <MetricCard
          title="Produtos Ativos"
          value={metrics.totalProducts}
          description="Produtos disponíveis no catálogo"
          icon={Package}
        />
        <MetricCard
          title="Total de Orçamentos"
          value={metrics.totalBudgets}
          description="Orçamentos ativos cadastrados"
          icon={FileText}
        />
        <MetricCard
          title="Orçamentos Enviados"
          value={metrics.sentBudgets}
          description="Orçamentos com status 'Enviado'"
          icon={Send}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Orçamentos Aprovados"
          value={metrics.approvedBudgets}
          description="Orçamentos com status 'Aprovado'"
          icon={CheckCircle}
          iconColor="text-green-500"
        />
        <MetricCard
          title="Orçamentos Reprovados"
          value={metrics.rejectedBudgets}
          description="Orçamentos com status 'Reprovado'"
          icon={XCircle}
          iconColor="text-red-500"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <div className="text-sm text-muted-foreground">Carregando...</div>
          </div>
        )}
        <BudgetsChart data={metrics.budgetsOverTime} />
        <ClientsChart data={metrics.clientsOverTime} />
      </div>
    </div>
  );
}
