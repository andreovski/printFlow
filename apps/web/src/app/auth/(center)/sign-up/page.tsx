'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { registerUserBodySchema, type RegisterUserBody } from '@magic-system/schemas';
import Link from 'next/link';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { signUpAction } from '../../actions';

export default function SignUpPage() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<RegisterUserBody>({
    resolver: zodResolver(registerUserBodySchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      earlyAccessCode: '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: RegisterUserBody) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const result = await signUpAction(null, formData);

      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="bg-background border rounded-lg shadow-sm p-6 max-w-md w-full">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Criar Conta</h1>
        <p className="text-muted-foreground text-sm">Cadastre-se no sistema</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="seu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="earlyAccessCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de Acesso Antecipado</FormLabel>
                <FormControl>
                  <Input placeholder="Digite seu código" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm">
        <Link href="/auth/sign-in" className="text-primary hover:underline">
          Já tem uma conta? Faça login
        </Link>
      </div>
    </div>
  );
}
