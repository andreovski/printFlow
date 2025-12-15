'use client';

import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useInvalidateTemplates } from '@/app/http/hooks';
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
import { EditorProvider } from '@/components/ui/shadcn-io/editor';
import { Switch } from '@/components/ui/switch';
import { useFormState } from '@/hooks/use-form-state';

import { createTemplateAction, updateTemplateAction } from '../actions';
import { TemplateActionDialogs } from './template-action-dialogs';

interface TemplateFormProps {
  id?: string;
  initialData?: {
    name: string;
    content: string;
    scope: 'GLOBAL' | 'BOARD' | 'BUDGET';
    active: boolean;
  };
}

export function TemplateForm({ id, initialData }: TemplateFormProps) {
  const router = useRouter();
  const invalidateTemplates = useInvalidateTemplates();

  const isEditing = !!id && !!initialData;
  const actionFn = isEditing
    ? (formData: FormData) => updateTemplateAction(id as string, null, formData)
    : (formData: FormData) => createTemplateAction(null, formData);

  const [state, action, isPending] = useFormState(actionFn);
  const [active, setActive] = useState(initialData?.active ?? true);
  const [content, setContent] = useState(initialData?.content || '');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getError = (field: string) => state?.errors?.[field]?.[0];

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message || 'Operação realizada com sucesso');
      invalidateTemplates(); // Invalida cache do React Query
      router.back();
    } else if (state?.message && !state?.success) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Card className="border-0 shadow-none">
      <form onSubmit={action}>
        <CardContent className="space-y-6 p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initialData?.name}
                placeholder="Ex: Proposta Comercial Padrão"
                className={getError('name') ? 'border-red-500' : ''}
              />
              {getError('name') && <span className="text-red-500 text-xs">{getError('name')}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Escopo de Utilização</Label>
              <Select name="scope" defaultValue={initialData?.scope || 'GLOBAL'}>
                <SelectTrigger className={getError('scope') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o escopo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="BOARD">Quadros</SelectItem>
                  <SelectItem value="BUDGET">Orçamentos</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define onde este template estará disponível para uso.
              </p>
              {getError('scope') && (
                <span className="text-red-500 text-xs">{getError('scope')}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo</Label>
              <div className={getError('content') ? 'border border-red-500 rounded-md' : ''}>
                <EditorProvider
                  content={content}
                  onUpdate={({ editor }) => setContent(editor.getHTML())}
                  placeholder="Digite o conteúdo do template aqui..."
                  className="min-h-[275px] border rounded-md p-4"
                />
              </div>
              <input type="hidden" name="content" value={content} />
              {getError('content') && (
                <span className="text-red-500 text-xs">{getError('content')}</span>
              )}
            </div>

            <input type="hidden" name="active" value={active.toString()} />
          </div>
        </CardContent>

        <CardFooter className="p-0 flex flex-col gap-2 sticky bottom-0 z-10 mt-auto border-t">
          <div className="flex w-full bg-background/35 backdrop-blur-sm py-2 px-4 gap-2">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Atualizar Template' : 'Criar Template'}
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
        <TemplateActionDialogs
          id={id}
          isDeleteOpen={isDeleteOpen}
          setIsDeleteOpen={setIsDeleteOpen}
        />
      )}
    </Card>
  );
}
