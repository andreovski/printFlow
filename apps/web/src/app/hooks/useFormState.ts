import { FormEvent, useState, useTransition } from 'react';

interface FormState {
  success: boolean;
  message: string | null;
  errors: Record<string, string[]> | null;
}

export function useFormState(action: (data: FormData) => Promise<any>, initialState?: FormState) {
  const [isPending, startTransition] = useTransition();

  const [formState, setFormState] = useState<FormState>(
    initialState ?? {
      success: false,
      message: null,
      errors: null,
    }
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        const result = await action(formData);
        setFormState(result);
      } catch (error) {
        console.error('Form action error:', error);
        setFormState({
          success: false,
          message: 'An unexpected error occurred.',
          errors: null,
        });
      }
    });
  }

  return [formState, handleSubmit, isPending] as const;
}
