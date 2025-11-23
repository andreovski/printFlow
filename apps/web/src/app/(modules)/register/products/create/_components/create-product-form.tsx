'use client';

import { createProductAction } from '../../actions';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export function CreateProductForm() {
  const [state, action] = useActionState(createProductAction, null);

  return (
    <Card className="border-0 shadow-none">
      <form action={action}>
        <CardContent className="space-y-4 pt-0 px-0">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" placeholder="Nome do Produto" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço</Label>
            <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" required />
          </div>

          {state?.error && <div className="text-sm text-destructive">{state.error}</div>}
        </CardContent>
        <CardFooter className="px-0 pt-6">
          <Button type="submit" className="w-full">
            Criar Produto
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
