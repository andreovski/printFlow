'use client';

import Image from 'next/image';
import { useFormState } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { createOrganizationAction } from '../actions';

export default function SetupOrganizationPage() {
  // @ts-ignore - useFormState types are tricky in RC
  const [state, action] = useFormState(createOrganizationAction, null);

  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex flex-col justify-center p-6 lg:p-12 xl:p-24 bg-background">
        <div className="w-full max-w-[550px] mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Configure sua Organização
            </h1>
            <p className="text-muted-foreground">
              Complete seu cadastro para começar a usar o sistema
            </p>
          </div>

          <form action={action} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Informações Básicas</h2>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Organização *</Label>
                    <Input id="name" name="name" placeholder="Nome da sua empresa" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enterpriseName">Razão Social</Label>
                      <Input id="enterpriseName" name="enterpriseName" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Contato</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mainEmail">Email *</Label>
                    <Input
                      id="mainEmail"
                      name="mainEmail"
                      type="email"
                      placeholder="contato@empresa.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mainPhone">Telefone *</Label>
                    <Input
                      id="mainPhone"
                      name="mainPhone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Endereço</h2>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP *</Label>
                      <Input id="cep" name="cep" placeholder="00000-000" required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Rua, Avenida, etc."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input id="number" name="number" placeholder="123" required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input id="complement" name="complement" placeholder="Apto, Sala, etc" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input id="city" name="city" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado *</Label>
                      <Input id="state" name="state" maxLength={2} placeholder="SP" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">País</Label>
                    <Input id="country" name="country" defaultValue="Brasil" />
                  </div>
                </div>
              </div>
            </div>

            {state?.error && (
              <div className="text-sm text-destructive font-medium text-center">{state.error}</div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-[#F59E0B] hover:bg-[#D97706] text-white"
            >
              Criar Organização
            </Button>
          </form>
        </div>
      </div>

      {/* Right Column - Illustration */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#FFFDF7] relative p-12 overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#FEF3C7] rounded-full opacity-50 blur-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FDE68A] rounded-full -mr-16 -mt-16 opacity-40" />

        <div className="relative z-10 max-w-lg w-full text-center space-y-8">
          <div className="relative w-full aspect-square">
            <Image
              src="/images/setup-org.png"
              alt="Team collaboration"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-900">
              Seu próximo grande passo começa aqui.
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              Configurar sua organização é o primeiro passo para otimizar seus processos e
              impulsionar o crescimento.
            </p>
          </div>
        </div>

        {/* Bottom decorative element */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#FFE4E6] rounded-full opacity-50 blur-2xl" />
      </div>
    </div>
  );
}
