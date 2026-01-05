import { cn } from '@/lib/utils';

interface DynamicCalendarIconProps {
  date: Date;
  className?: string;
}

export function DynamicCalendarIcon({ date, className }: DynamicCalendarIconProps) {
  return (
    <div
      className={cn(
        'flex h-10 w-10 flex-col items-center overflow-hidden rounded-[6px]  bg-white shadow-sm',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex h-4 w-full items-center justify-center bg-red-500">
        <span className="text-[10px] font-bold leading-none text-white uppercase">
          {date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center pb-0.5">
        <span className="text-lg font-bold text-slate-900 leading-none">{date.getDate()}</span>
      </div>
    </div>
  );
}
