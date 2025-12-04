import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-muted-foreground',
}: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-xs font-medium line-clamp-2">{title}</h3>
        <Icon className={`h-4 w-4 ${iconColor} flex-shrink-0`} />
      </div>
      <div className="px-4 pb-4 pt-0">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      </div>
    </div>
  );
}
