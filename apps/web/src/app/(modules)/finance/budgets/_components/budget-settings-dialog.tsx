'use client';

import { Organization } from '@magic-system/schemas';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { updateOrganization } from '@/app/http/requests/organization';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface BudgetSettingsDialogProps {
  organization: Organization | null;
}

export function BudgetSettingsDialog({ organization }: BudgetSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    budgetAutoInactive: organization?.budgetAutoInactive ?? false,
    budgetAutoArchive: organization?.budgetAutoArchive ?? false,
    budgetShowTotalInKanban: organization?.budgetShowTotalInKanban ?? false,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateOrganization(settings);
      toast.success('Configurações salvas com sucesso!');
      setOpen(false);
      window.location.reload(); // Reload to refresh organization data
    } catch (_error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurações de Orçamentos</DialogTitle>
          <DialogDescription>Configure o comportamento automático dos orçamentos</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="auto-inactive" className="flex flex-col space-y-1">
              <span>Inativar automaticamente</span>
              <span className="font-normal text-sm text-muted-foreground">
                Inativa orçamentos quando a data de vencimento ultrapassar a data atual
              </span>
            </Label>
            <Switch
              id="auto-inactive"
              checked={settings.budgetAutoInactive}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, budgetAutoInactive: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="auto-archive" className="flex flex-col space-y-1">
              <span>Arquivar automaticamente</span>
              <span className="font-normal text-sm text-muted-foreground">
                Arquiva orçamentos após 30 dias com status Inativo
              </span>
            </Label>
            <Switch
              id="auto-archive"
              checked={settings.budgetAutoArchive}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, budgetAutoArchive: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="show-total" className="flex flex-col space-y-1">
              <span>Exibir valor total no Kanban</span>
              <span className="font-normal text-sm text-muted-foreground">
                Mostra o valor total no resumo do card do Kanban
              </span>
            </Label>
            <Switch
              id="show-total"
              checked={settings.budgetShowTotalInKanban}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, budgetShowTotalInKanban: checked }))
              }
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
