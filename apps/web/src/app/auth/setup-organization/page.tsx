'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createOrganizationBodySchema, type CreateOrganizationBody } from '@magic-system/schemas';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { UTApi } from 'uploadthing/server';

import { WebsiteMaintenanceIllustration } from '@/components/assets/website-maintenance-illustration';
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
import { Label } from '@/components/ui/label';
import { maskCNPJ, maskPhone, maskCEP } from '@/lib/masks';
import { fetchCNPJData } from '@/lib/opencnpj';
import { UploadButton } from '@/lib/uploadthing-components';

import { createOrganizationAction } from '../actions';

export default function SetupOrganizationPage() {
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
  const [logoData, setLogoData] = useState<{
    url: string;
    key: string;
    size: number;
    name: string;
  } | null>(null);

  const form = useForm<CreateOrganizationBody>({
    resolver: zodResolver(createOrganizationBodySchema) as any,
    defaultValues: {
      name: '',
      cnpj: '',
      enterpriseName: '',
      mainEmail: '',
      mainPhone: '',
      cep: '',
      address: '',
      number: '',
      complement: '',
      city: '',
      state: '',
      country: 'Brasil',
    },
    mode: 'onChange',
  });

  const handleNextStep = async () => {
    const fieldsToValidate: (keyof CreateOrganizationBody)[] = [
      'name',
      'mainEmail',
      'mainPhone',
      'cnpj',
      'enterpriseName',
    ];

    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep(2);
    }
  };

  const handleCNPJChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const maskedValue = maskCNPJ(value);
    event.target.value = maskedValue;

    // Update the form field with masked value
    form.setValue('cnpj', maskedValue);

    const cleanCNPJ = value.replace(/\D/g, '');

    if (cleanCNPJ.length === 14) {
      setIsLoadingCNPJ(true);
      const cnpjData = await fetchCNPJData(cleanCNPJ);

      if (cnpjData) {
        // Populate company fields
        form.setValue('enterpriseName', cnpjData.razaoSocial);
        form.setValue('name', cnpjData.nomeFantasia || cnpjData.razaoSocial);

        // Populate contact fields
        if (cnpjData.email) {
          form.setValue('mainEmail', cnpjData.email);
        }
        if (cnpjData.telefone) {
          form.setValue('mainPhone', maskPhone(cnpjData.telefone));
        }

        // Populate address fields
        if (cnpjData.cep) {
          form.setValue('cep', maskCEP(cnpjData.cep));
        }
        if (cnpjData.logradouro) {
          form.setValue('address', cnpjData.logradouro);
        }
        if (cnpjData.numero) {
          form.setValue('number', cnpjData.numero);
        }
        if (cnpjData.complemento) {
          form.setValue('complement', cnpjData.complemento);
        }
        if (cnpjData.municipio) {
          form.setValue('city', cnpjData.municipio);
        }
        if (cnpjData.uf) {
          form.setValue('state', cnpjData.uf);
        }

        toast.success('Dados da organização encontrados!');
      } else {
        toast.error('CNPJ não encontrado. Verifique o número e tente novamente.');
      }
      setIsLoadingCNPJ(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (logoData?.key) {
      try {
        const utapi = new UTApi();
        await utapi.deleteFiles(logoData.key);
        toast.success('Logo removida com sucesso!');
      } catch (error) {
        console.error('Error deleting logo:', error);
        toast.error('Erro ao remover logo do servidor');
      }
    }
    setLogoData(null);
  };

  const onSubmit = (data: CreateOrganizationBody) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Add logo metadata if uploaded
      if (logoData) {
        formData.append('logoUrl', logoData.url);
        formData.append('logoKey', logoData.key);
        formData.append('logoSize', logoData.size.toString());
        formData.append('logoName', logoData.name);
      }

      const result = await createOrganizationAction(null, formData);

      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

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

          <div className="text-center">
            <p className="text-sm text-muted-foreground">Passo {currentStep} de 2</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-500">
                    <h2 className="text-lg font-semibold text-foreground">Dados da Organização</h2>

                    {/* Logo Upload Section */}
                    <div className="space-y-2">
                      <Label>Logo da Organização (opcional)</Label>
                      {logoData ? (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                          <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                            <Image
                              src={logoData.url}
                              alt="Logo preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{logoData.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(logoData.size / 1024).toFixed(0)} KB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveLogo}
                          >
                            Remover
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <UploadButton
                            endpoint="organizationLogo"
                            onClientUploadComplete={(res) => {
                              if (res && res.length > 0) {
                                const file = res[0];
                                setLogoData({
                                  url: file.url,
                                  key: file.key,
                                  size: file.size,
                                  name: file.name,
                                });
                                toast.success('Logo enviada com sucesso!');
                              }
                            }}
                            onUploadError={(error: Error) => {
                              toast.error(`Erro ao enviar logo: ${error.message}`);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="00.000.000/0000-00"
                                  {...field}
                                  onChange={(e) => {
                                    handleCNPJChange(e);
                                  }}
                                  disabled={isLoadingCNPJ}
                                  maxLength={18}
                                />
                                {isLoadingCNPJ && (
                                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="enterpriseName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Razão Social</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Organização *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da sua empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="mainEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="contato@empresa.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mainPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone *</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="(00) 00000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in-0 slide-in-from-left-4 duration-500">
                    <h2 className="text-lg font-semibold text-foreground">Endereço</h2>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="cep"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP *</FormLabel>
                              <FormControl>
                                <Input placeholder="00000-000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Endereço *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Rua, Avenida, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número *</FormLabel>
                              <FormControl>
                                <Input placeholder="123" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="complement"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Complemento</FormLabel>
                                <FormControl>
                                  <Input placeholder="Apto, Sala, etc" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cidade *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado *</FormLabel>
                              <FormControl>
                                <Input maxLength={2} placeholder="SP" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {currentStep === 1 && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-12 text-base font-semibold bg-primary"
                >
                  Próximo
                </Button>
              )}

              {currentStep === 2 && (
                <div className="flex gap-4 transition">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 h-12 text-base font-semibold"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 text-base font-semibold"
                    disabled={isPending}
                  >
                    {isPending ? 'Criando...' : 'Criar Organização'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>

      {/* Right Column - Illustration */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-background relative p-12 overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#FEF3C7] rounded-full opacity-50 blur-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FDE68A] rounded-full -mr-16 -mt-16 opacity-40" />

        <div className="relative z-10 max-w-lg w-full text-center space-y-8">
          <div className="relative w-full aspect-square">
            <WebsiteMaintenanceIllustration className="w-full h-full object-contain" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight text-foreground">
              Seu próximo grande passo começa aqui.
            </h2>
            <p className="text-foreground text-lg leading-relaxed">
              Configurar sua organização é o primeiro passo para otimizar seus processos e
              impulsionar o crescimento.
            </p>
          </div>
        </div>

        {/* Bottom decorative element */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#FFE4E6] dark:bg-slate-900 rounded-full opacity-50 blur-2xl" />
      </div>
    </div>
  );
}
