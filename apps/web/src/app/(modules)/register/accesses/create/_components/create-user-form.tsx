'use client';

import { createUserAction } from '../../actions';
import { useFormState } from 'react-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CreateUserForm() {
  const [state, action] = useFormState(createUserAction, null);
  const [role, setRole] = useState('EMPLOYEE');

  return (
    <Card className='border-0 shadow-none'>
      <form action={action}>
        <CardContent className="space-y-4 pt-0 px-0">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" placeholder="João Silva" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="joao@exemplo.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="******"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Perfil</Label>
            <Select name="role" value={role} onValueChange={setRole}>
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

        <CardFooter className='px-0 pt-6'>
          <Button type="submit" className='w-full'>Criar Acesso</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
