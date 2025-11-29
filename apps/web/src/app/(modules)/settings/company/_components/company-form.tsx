'use client';

import { Organization } from '@magic-system/schemas';
import { Loader2 } from 'lucide-react';
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
import { BRAZILIAN_STATES } from '@/lib/constants';
import { maskCNPJ, maskPhone, maskCEP } from '@/lib/masks';
import { fetchAddressByCEP } from '@/lib/viacep';

import { updateCompanySettingsAction } from '../actions';

interface CompanyFormProps {
  initialData: Organization | null;
}

export function CompanyForm({ initialData }: CompanyFormProps) {
  const [state, action, isPending] = useFormState(updateCompanySettingsAction);

  // Address fields state
  const [addressFields, setAddressFields] = useState({
    street: initialData?.address || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
  });
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  const getError = (field: string) => state?.errors?.[field]?.[0];

  const handleMask = (
    event: React.ChangeEvent<HTMLInputElement>,
    maskFunction: (value: string) => string
  ) => {
    const { value } = event.target;
    event.target.value = maskFunction(value);
  };

  const handleCEPChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const maskedValue = maskCEP(value);
    event.target.value = maskedValue;

    const cleanCEP = value.replace(/\D/g, '');

    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true);
      const addressData = await fetchAddressByCEP(cleanCEP);
      setIsLoadingCEP(false);

      if (addressData) {
        setAddressFields({
          street: addressData.street,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
        });
        toast.success('Endereço encontrado!');
      }
    }
  };

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
    } else if (state?.message && !state?.success) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Card className="border-0 shadow-none h-full flex flex-col overflow-hidden p-2 pt-0">
      <form onSubmit={action} className="flex flex-col h-full overflow-hidden">
        <CardContent className="space-y-6 flex-1 overflow-y-auto">
          {/* Seção: Dados da Empresa */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Dados cadastrais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  defaultValue={initialData?.cnpj ? maskCNPJ(initialData.cnpj) : ''}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  onChange={(e) => handleMask(e, maskCNPJ)}
                  className={getError('cnpj') ? 'border-red-500' : ''}
                />
                {getError('cnpj') && (
                  <span className="text-red-500 text-xs">{getError('cnpj')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="enterpriseName">Razão Social</Label>
                <Input
                  id="enterpriseName"
                  name="enterpriseName"
                  defaultValue={initialData?.enterpriseName || initialData?.name || ''}
                  placeholder="Razão Social da Empresa"
                  className={getError('enterpriseName') ? 'border-red-500' : ''}
                />
                {getError('enterpriseName') && (
                  <span className="text-red-500 text-xs">{getError('enterpriseName')}</span>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fantasyName">Nome Fantasia</Label>
                <Input
                  id="fantasyName"
                  name="fantasyName"
                  defaultValue={initialData?.fantasyName || ''}
                  placeholder="Nome Fantasia"
                  className={getError('fantasyName') ? 'border-red-500' : ''}
                />
                {getError('fantasyName') && (
                  <span className="text-red-500 text-xs">{getError('fantasyName')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Contato */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mainEmail">Email Principal</Label>
                <Input
                  id="mainEmail"
                  name="mainEmail"
                  type="email"
                  defaultValue={initialData?.mainEmail || ''}
                  placeholder="empresa@exemplo.com"
                  className={getError('mainEmail') ? 'border-red-500' : ''}
                />
                {getError('mainEmail') && (
                  <span className="text-red-500 text-xs">{getError('mainEmail')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainPhone">Telefone Principal</Label>
                <Input
                  id="mainPhone"
                  name="mainPhone"
                  defaultValue={initialData?.mainPhone ? maskPhone(initialData.mainPhone) : ''}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  onChange={(e) => handleMask(e, maskPhone)}
                  className={getError('mainPhone') ? 'border-red-500' : ''}
                />
                {getError('mainPhone') && (
                  <span className="text-red-500 text-xs">{getError('mainPhone')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Endereço */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    name="cep"
                    defaultValue={initialData?.cep ? maskCEP(initialData.cep) : ''}
                    placeholder="00000-000"
                    maxLength={9}
                    onChange={handleCEPChange}
                    className={getError('cep') ? 'border-red-500' : ''}
                    disabled={isLoadingCEP}
                  />
                  {isLoadingCEP && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {getError('cep') && <span className="text-red-500 text-xs">{getError('cep')}</span>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  name="address"
                  value={addressFields.street}
                  onChange={(e) => setAddressFields({ ...addressFields, street: e.target.value })}
                  placeholder="Rua, Avenida, etc."
                  className={getError('address') ? 'border-red-500' : ''}
                />
                {getError('address') && (
                  <span className="text-red-500 text-xs">{getError('address')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressNumber">Número</Label>
                <Input
                  id="addressNumber"
                  name="addressNumber"
                  defaultValue={initialData?.addressNumber || ''}
                  placeholder="Número"
                  className={getError('addressNumber') ? 'border-red-500' : ''}
                />
                {getError('addressNumber') && (
                  <span className="text-red-500 text-xs">{getError('addressNumber')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="complement">Complemento (Opcional)</Label>
                <Input
                  id="complement"
                  name="complement"
                  defaultValue={initialData?.complement || ''}
                  placeholder="Sala, Bloco, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro (Opcional)</Label>
                <Input
                  id="neighborhood"
                  name="neighborhood"
                  value={addressFields.neighborhood}
                  onChange={(e) =>
                    setAddressFields({ ...addressFields, neighborhood: e.target.value })
                  }
                  placeholder="Bairro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  name="city"
                  value={addressFields.city}
                  onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })}
                  placeholder="Cidade"
                  className={getError('city') ? 'border-red-500' : ''}
                />
                {getError('city') && (
                  <span className="text-red-500 text-xs">{getError('city')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select
                  name="state"
                  value={addressFields.state}
                  onValueChange={(value) => setAddressFields({ ...addressFields, state: value })}
                >
                  <SelectTrigger className={getError('state') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getError('state') && (
                  <span className="text-red-500 text-xs">{getError('state')}</span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  name="country"
                  defaultValue={initialData?.country || 'Brasil'}
                  placeholder="País"
                  className={getError('country') ? 'border-red-500' : ''}
                />
                {getError('country') && (
                  <span className="text-red-500 text-xs">{getError('country')}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-0 flex flex-col gap-2 mt-auto border-t shrink-0">
          <div className="flex w-full bg-background/35 backdrop-blur-sm py-2 px-4 gap-2">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
