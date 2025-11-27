import { BudgetStatus, budgetStatusLabel } from '@magic-system/schemas';
import { Controller } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const StatusBulletColor: Record<BudgetStatus, string> = {
  DRAFT: 'bg-gray-500',
  SENT: 'bg-blue-500',
  ACCEPTED: 'bg-green-500',
  REJECTED: 'bg-red-500',
  INACTIVE: 'bg-yellow-500',
};

export const StatusSelect = ({
  form,
  initialStatus,
  isReadOnly,
}: {
  form: any;
  initialStatus: BudgetStatus;
  isReadOnly: boolean;
}) => {
  return (
    <Controller
      control={form.control}
      name="status"
      render={({ field }) => (
        <>
          <Select
            value={field.value}
            onValueChange={(val) => field.onChange(val)}
            disabled={initialStatus === 'INACTIVE'}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isReadOnly
                    ? budgetStatusLabel[initialStatus as BudgetStatus]
                    : 'Selecione um status'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(budgetStatusLabel).map(([key, value]) => {
                return (
                  <SelectItem key={key} value={key}>
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${StatusBulletColor[key as BudgetStatus]}`}
                    ></span>
                    {value}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {form.formState.errors.status && (
            <span className="text-red-500 text-sm">{form.formState.errors.status.message}</span>
          )}
        </>
      )}
    />
  );
};
