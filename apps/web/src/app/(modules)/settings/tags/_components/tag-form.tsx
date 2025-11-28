'use client';

import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useFormState } from '@/app/hooks/useFormState';
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

import { createTagAction, updateTagAction } from '../actions';
import { ColorPicker } from './color-picker';
import { TagActionDialogs } from './tag-action-dialogs';

interface TagFormProps {
  id?: string;
  initialData?: {
    name: string;
    color: string;
    scope: 'GLOBAL' | 'BUDGET' | 'PRODUCTION';
    active: boolean;
  };
}

export function TagForm({ id, initialData }: TagFormProps) {
  const router = useRouter();

  const isEditing = !!id && !!initialData;
  const actionFn = isEditing
    ? (formData: FormData) => updateTagAction(id as string, null, formData)
    : (formData: FormData) => createTagAction(null, formData);

  const [state, action, isPending] = useFormState(actionFn);
  const [active, setActive] = useState(initialData?.active ?? true);
  const [tagName, setTagName] = useState(initialData?.name ?? '');
  const [selectedColor, setSelectedColor] = useState(initialData?.color ?? '#3B82F6');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getError = (field: string) => state?.errors?.[field]?.[0];

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Operação realizada com sucesso');
      router.back();
    } else if (state?.message && !state?.success) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <Card className="border-0 shadow-none">
      <form onSubmit={action}>
        <CardContent className="space-y-6 p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Tag</Label>
              <Input
                id="name"
                name="name"
                value={tagName}
                onChange={(e) => e.target.value.length <= 30 && setTagName(e.target.value)}
                placeholder="Ex: Urgente, Em Produção, Aprovado..."
                className={getError('name') ? 'border-red-500' : ''}
              />
              {getError('name') && <span className="text-red-500 text-xs">{getError('name')}</span>}
            </div>

            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              error={getError('color')}
            />
            <input type="hidden" name="color" value={selectedColor} />

            <div className="space-y-2">
              <Label htmlFor="scope">Escopo de Visibilidade</Label>
              <Select name="scope" defaultValue={initialData?.scope || 'GLOBAL'}>
                <SelectTrigger className={getError('scope') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o escopo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global (Todo o sistema)</SelectItem>
                  <SelectItem value="BUDGET">Orçamentos</SelectItem>
                  <SelectItem value="PRODUCTION">Produção</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define onde esta tag será visível no sistema
              </p>
              {getError('scope') && (
                <span className="text-red-500 text-xs">{getError('scope')}</span>
              )}
            </div>

            <input type="hidden" name="active" value={active.toString()} />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Pré-visualização</Label>
            <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: selectedColor }}
              >
                {tagName || 'Nome da Tag'}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-0 flex flex-col gap-2 sticky bottom-0 z-10 mt-auto border-t">
          <div className="flex w-full bg-background/35 backdrop-blur-sm py-2 px-4 gap-2">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Atualizar Tag' : 'Criar Tag'}
            </Button>

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
          </div>
        </CardFooter>
      </form>
      {isEditing && id && (
        <TagActionDialogs id={id} isDeleteOpen={isDeleteOpen} setIsDeleteOpen={setIsDeleteOpen} />
      )}
    </Card>
  );
}
