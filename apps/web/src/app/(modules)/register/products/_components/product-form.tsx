'use client';

import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useInvalidateProducts } from '@/app/http/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useFormState } from '@/hooks/use-form-state';
import { maskCurrency } from '@/lib/masks';

import { createProductAction, updateProductAction } from '../actions';
import { ProductActionDialogs } from './product-action-dialogs';

interface ProductFormProps {
  id?: string;
  initialData?: {
    title: string;
    description?: string;
    code?: string;
    ncm?: number | null;
    unitType: 'm2' | 'unidade';
    costPrice: number;
    salePrice: number;
    stock: number;
    category?: string[];
    active: boolean;
    organizationId?: string;
  };
  onSuccess?: () => void;
}

export function ProductForm({ id, initialData, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const invalidateProducts = useInvalidateProducts();

  const isEditing = !!id && !!initialData;
  const actionFn = isEditing
    ? (formData: FormData) => updateProductAction(id as string, null, formData)
    : (formData: FormData) => createProductAction(null, formData);

  const [state, action, isPending] = useFormState(actionFn);
  const [active, setActive] = useState(initialData?.active ?? true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getError = (field: string) => state?.errors?.[field]?.[0];

  const handleCurrencyMask = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    event.target.value = maskCurrency(value);
  };

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Operação realizada com sucesso');
      invalidateProducts(); // Invalida cache do React Query
      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state, router, onSuccess, invalidateProducts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="border-0 shadow-none">
      <form onSubmit={action}>
        <CardContent className="space-y-6 p-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Dados do Produto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={initialData?.title}
                  placeholder="Nome do produto"
                  className={getError('title') ? 'border-red-500' : ''}
                />
                {getError('title') && (
                  <span className="text-red-500 text-xs">{getError('title')}</span>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={initialData?.description}
                  placeholder="Descrição detalhada do produto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={initialData?.code}
                  placeholder="Código do produto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ncm">NCM do Produto</Label>
                <Input
                  id="ncm"
                  name="ncm"
                  type="number"
                  step="0.01"
                  defaultValue={initialData?.ncm ?? undefined}
                  placeholder="Ex: 4823.90.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitType">Unidade</Label>
                <Select name="unitType" defaultValue={initialData?.unitType || 'unidade'}>
                  <SelectTrigger className={getError('unitType') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="m2">M²</SelectItem>
                  </SelectContent>
                </Select>
                {getError('unitType') && (
                  <span className="text-red-500 text-xs">{getError('unitType')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Preço de Custo</Label>
                <Input
                  id="costPrice"
                  name="costPrice"
                  defaultValue={initialData?.costPrice ? formatCurrency(initialData.costPrice) : ''}
                  placeholder="R$ 0,00"
                  onChange={handleCurrencyMask}
                  className={getError('costPrice') ? 'border-red-500' : ''}
                />
                {getError('costPrice') && (
                  <span className="text-red-500 text-xs">{getError('costPrice')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice">Preço de Venda</Label>
                <Input
                  id="salePrice"
                  name="salePrice"
                  defaultValue={initialData?.salePrice ? formatCurrency(initialData.salePrice) : ''}
                  placeholder="R$ 0,00"
                  onChange={handleCurrencyMask}
                  className={getError('salePrice') ? 'border-red-500' : ''}
                />
                {getError('salePrice') && (
                  <span className="text-red-500 text-xs">{getError('salePrice')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  defaultValue={initialData?.stock}
                  placeholder="0"
                  className={getError('stock') ? 'border-red-500' : ''}
                />
                {getError('stock') && (
                  <span className="text-red-500 text-xs">{getError('stock')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  name="category"
                  defaultValue={initialData?.category?.join(', ')}
                  placeholder="Categorias (separadas por vírgula)"
                />
                <p className="text-xs text-muted-foreground">Separe as categorias por vírgula</p>
              </div>

              <input type="hidden" name="active" value={active.toString()} />
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-0 flex flex-col gap-2 sticky bottom-0 z-10 mt-auto border-t">
          <div className="flex w-full bg-background/35 backdrop-blur-sm py-2 px-4 gap-2">
            {isEditing && (
              <div className="flex gap-2 w-full items-center">
                <div className="flex items-center gap-2 w-1/2 justify-center border p-2 rounded-md">
                  <Switch id="active-switch" checked={active} onCheckedChange={setActive} />
                  <Label htmlFor="active-switch">{active ? 'Ativo' : 'Inativo'}</Label>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-1/2"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Atualizar Produto' : 'Criar Produto'}
            </Button>
          </div>
        </CardFooter>
      </form>
      {isEditing && id && (
        <ProductActionDialogs
          id={id}
          isDeleteOpen={isDeleteOpen}
          setIsDeleteOpen={setIsDeleteOpen}
        />
      )}
    </Card>
  );
}
