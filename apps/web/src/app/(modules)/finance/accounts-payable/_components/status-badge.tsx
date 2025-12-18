'use client';

import { AccountsPayableStatus } from '@magic-system/schemas';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<
  AccountsPayableStatus,
  {
    label: string;
    className: string;
    icon: React.ElementType;
  }
> = {
  PENDING: {
    label: 'Pendente',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Clock,
  },
  PAID: {
    label: 'Pago',
    className: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
  OVERDUE: {
    label: 'Atrasado',
    className: 'bg-red-100 text-red-800 border-red-300',
    icon: AlertCircle,
  },
};

interface StatusBadgeProps {
  status: AccountsPayableStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn('font-medium gap-1', config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
