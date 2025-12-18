'use client';

import { endOfMonth, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useDatesWithBills } from '@/app/http/hooks/use-accounts-payable';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface CalendarSidebarProps {
  selectedDate?: Date;
  onSelectDate: (date: Date | undefined) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function CalendarSidebar({
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
}: CalendarSidebarProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: datesData } = useDatesWithBills(monthStart, monthEnd, { enabled: true });
  const datesWithBills = datesData?.dates?.map((d) => new Date(d)) ?? [];

  return (
    <div className="hidden lg:block w-[300px]">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        locale={ptBR}
        month={currentMonth}
        onMonthChange={onMonthChange}
        modifiers={{
          hasBills: datesWithBills,
        }}
        className="p-0 w-full border-2 p-2 rounded-lg bg-secondary"
        classNames={{
          today: 'bg-primary/20 rounded-full',
          day_button: 'rounded-full hover:bg-primary/20',
          button_next:
            'bg-secondary w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors',
          button_previous:
            'bg-secondary w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors',
        }}
        modifiersClassNames={{
          hasBills: cn(
            'relative',
            'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2',
            'after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary'
          ),
        }}
      />
    </div>
  );
}
