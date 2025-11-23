'use client';

import { updateProductAction } from '../../../actions';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface UpdateProductFormProps {
  id: string;
  initialData: {
    name: string;
    price: number;
  };
}

export function UpdateProductForm({ id, initialData }: UpdateProductFormProps) {
  const updateProductWithId = updateProductAction.bind(null, id);
  const [state, action] = useFormState(updateProductWithId, null);

  return (
    <Card className="border-0 shadow-none">
      <form action={action}>
        <CardContent className="space-y-4 pt-0 px-0">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData.name}
              placeholder="Nome do Produto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              defaultValue={initialData.price}
              placeholder="0.00"
            />
          </div>

          {state?.error && <div className="text-sm text-destructive">{state.error}</div>}
        </CardContent>
        <CardFooter className="px-0 pt-6">
          <Button type="submit" className="w-full">Atualizar Produto</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
