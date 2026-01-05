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
    className: 'bg-yellow-500/30 text-yellow-600',
    icon: Clock,
  },
  PAID: {
    label: 'Pago',
    className: 'bg-green-500/30 text-green-600',
    icon: CheckCircle2,
  },
  OVERDUE: {
    label: 'Atrasado',
    className: 'bg-red-500/30 text-red-600',
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
    <Badge
      variant="outline"
      className={cn('font-medium gap-1 border-none', config.className, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
