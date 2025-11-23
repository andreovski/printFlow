'use client';

import { signInAction } from '../actions';
import { useFormState } from 'react-dom';

export default function SignInPage() {
  // @ts-ignore - useFormState types are tricky in RC
  const [state, action] = useFormState(signInAction, null);

  return (
    <div className="bg-background border rounded-lg shadow-sm p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Bem-vindo</h1>
        <p className="text-muted-foreground text-sm">Entre na sua conta</p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="seu@email.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {state?.error && <div className="text-sm text-destructive text-center">{state.error}</div>}

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md inline-flex items-center justify-center text-sm font-medium transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
