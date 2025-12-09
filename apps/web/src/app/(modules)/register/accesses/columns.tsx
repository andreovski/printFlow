'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { useDeleteUser } from '@/app/http/hooks/use-users';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'ADMIN' | 'MASTER';
};

const roleLabels: Record<string, string> = {
  EMPLOYEE: 'Funcionário',
  ADMIN: 'Administrador',
  MASTER: 'Master',
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => <div className="font-medium">{row.getValue('name') || '-'}</div>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Perfil',
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      return <Badge>{roleLabels[role] || role}</Badge>;
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Ações</div>,
    cell: function ActionsCell({ row }) {
      const user = row.original;
      const isMaster = user.role === 'MASTER';
      const deleteUserMutation = useDeleteUser();

      const handleDelete = async () => {
        if (confirm('Tem certeza que deseja deletar este acesso?')) {
          try {
            await deleteUserMutation.mutateAsync(user.id);
            toast.success('Acesso deletado com sucesso');
          } catch (error) {
            console.error(error);
            toast.error('Erro ao deletar acesso');
          }
        }
      };

      return (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" asChild disabled={isMaster}>
            {isMaster ? (
              <span className="opacity-50 cursor-not-allowed">
                <Pencil className="h-4 w-4" />
              </span>
            ) : (
              <Link href={`/register/accesses/update/${user.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            disabled={isMaster || deleteUserMutation.isPending}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
