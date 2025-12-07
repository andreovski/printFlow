'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';

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

import { updateUserAction } from '../../../actions';

interface UpdateUserFormProps {
  id: string;
  initialData: {
    name: string;
    email: string;
    role: string;
  };
}

export function UpdateUserForm({ id, initialData }: UpdateUserFormProps) {
  const updateUserWithId = updateUserAction.bind(null, id);
  const [state, action] = useFormState(updateUserWithId, null);
  const [role, setRole] = useState(initialData.role);

  const isMaster = initialData.role === 'MASTER';

  return (
    <Card className="border-0 shadow-none px-4">
      <form action={action}>
        <CardContent className="space-y-4 pt-0 px-0">
          {isMaster && (
            <div
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
              role="alert"
            >
              <p className="font-bold">Acesso Restrito</p>
              <p>Usuários Master não podem ser editados.</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData.name}
              placeholder="João Silva"
              disabled={isMaster}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initialData.email}
              placeholder="joao@exemplo.com"
              disabled={isMaster}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Perfil</Label>
            <Select value={role} onValueChange={setRole} disabled={isMaster}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Funcionário</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="MASTER">Master</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="role" value={role} />
          </div>

          {state?.error && <div className="text-sm text-destructive">{state.error}</div>}
        </CardContent>
        <CardFooter className="px-0 pt-6">
          <Button type="submit" disabled={isMaster} className="w-full">
            Atualizar Acesso
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
