'use client';

import { Loader2, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useFormState } from '@/app/hooks/useFormState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { BRAZILIAN_STATES } from '@/lib/constants';
import { maskCNPJ, maskCPF, maskOnlyNumbers, maskPhone, maskCEP } from '@/lib/masks';
import { fetchCNPJData } from '@/lib/opencnpj';
import { fetchAddressByCEP } from '@/lib/viacep';

import { createClientAction, updateClientAction } from '../actions';
import { ClientActionDialogs } from './client-action-dialogs';

interface ClientFormProps {
  id?: string;
  initialData?: {
    name: string;
    fantasyName?: string;
    email?: string;
    personType: string;
    document: string;
    stateRegistration?: string | null;
    phone: string;
    isWhatsapp: boolean;
    rg?: string;
    cep?: string;
    addressType?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    country?: string;
    notes?: string;
    active: boolean;
  };
  onSuccess?: () => void;
}

export function ClientForm({ id, initialData, onSuccess }: ClientFormProps) {
  const router = useRouter();

  const isEditing = !!id && !!initialData;
  const actionFn = isEditing
    ? (formData: FormData) => updateClientAction(formData, id as string)
    : (formData: FormData) => createClientAction(formData);
  const [state, action, isPending] = useFormState(actionFn);

  const [personType, setPersonType] = useState(initialData?.personType || 'FISICA');
  const [active, setActive] = useState(initialData?.active ?? true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Address fields state
  const [addressFields, setAddressFields] = useState({
    street: initialData?.address || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    addressNumber: initialData?.addressNumber || '',
    cep: initialData?.cep || '',
  });
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);

  // Company fields state for CNPJ lookup
  const [companyFields, setCompanyFields] = useState({
    name: initialData?.name || '',
    fantasyName: initialData?.fantasyName || '',
  });
  const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);

  // Contact fields state for CNPJ lookup
  const [contactFields, setContactFields] = useState({
    email: initialData?.email || '',
    phone: initialData?.phone || '',
  });

  const getError = (field: string) => state?.errors?.[field]?.[0];

  const handleMask = (
    event: React.ChangeEvent<HTMLInputElement>,
    maskFunction: (value: string) => string
  ) => {
    const { value } = event.target;
    event.target.value = maskFunction(value);
  };

  const handleCEPChange = async (cleanCEP: string) => {
    setIsLoadingCEP(true);
    const addressData = await fetchAddressByCEP(cleanCEP);
    setIsLoadingCEP(false);

    if (addressData) {
      setAddressFields((prev) => ({
        ...prev,
        street: addressData.street,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
      }));
      toast.success('Endereço encontrado!');
    }
  };

  const handleCNPJChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const maskedValue = maskCNPJ(value);
    event.target.value = maskedValue;

    const cleanCNPJ = value.replace(/\D/g, '');

    if (cleanCNPJ.length === 14) {
      setIsLoadingCNPJ(true);
      const cnpjData = await fetchCNPJData(cleanCNPJ);

      if (cnpjData) {
        setCompanyFields({
          name: cnpjData.razaoSocial,
          fantasyName: cnpjData.nomeFantasia,
        });
        // Optionally fill address if not already set
        if (!addressFields.street) {
          setAddressFields({
            street: cnpjData.logradouro,
            neighborhood: cnpjData.bairro,
            city: cnpjData.municipio,
            state: cnpjData.uf,
            addressNumber: cnpjData.numero,
            cep: maskCEP(cnpjData.cep),
          });
        }
        // Fill contact fields
        setContactFields({
          email: cnpjData.email || '',
          phone: cnpjData.telefone ? maskPhone(cnpjData.telefone) : '',
        });
        toast.success('Dados da empresa encontrados!');
      }
      setIsLoadingCNPJ(false);
    }
  };

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message);
      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
    } else if (state?.message) {
      toast.error(state.message);
    }
  }, [state, router, onSuccess]);

  return (
    <>
      <Card className="border-0 shadow-none">
        <form onSubmit={action}>
          <CardContent className="space-y-6 p-4">
            {/* Seção: Dados Pessoais/Empresariais */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Dados cadastrais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="personType">Tipo de Pessoa</Label>
                  <Select
                    name="personType"
                    value={personType}
                    onValueChange={setPersonType}
                    disabled={isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FISICA">Pessoa Física</SelectItem>
                      <SelectItem value="JURIDICA">Pessoa Jurídica</SelectItem>
                      <SelectItem value="ESTRANGEIRO">Estrangeiro</SelectItem>
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="personType" value={personType} />
                  <input type="hidden" name="active" value={active.toString()} />
                </div>

                {personType === 'JURIDICA' && (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="document">CNPJ</Label>
                      <div className="relative">
                        <Input
                          id="document"
                          name="document"
                          defaultValue={initialData?.document ? maskCNPJ(initialData.document) : ''}
                          placeholder="00.000.000/0000-00"
                          disabled={isEditing || isLoadingCNPJ}
                          maxLength={18}
                          onChange={handleCNPJChange}
                          className={getError('document') ? 'border-red-500' : ''}
                        />
                        {isLoadingCNPJ && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      {getError('document') && (
                        <span className="text-red-500 text-xs">{getError('document')}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Razão Social</Label>
                      <Input
                        id="name"
                        name="name"
                        value={companyFields.name}
                        onChange={(e) =>
                          setCompanyFields({ ...companyFields, name: e.target.value })
                        }
                        placeholder="Razão Social"
                        className={getError('name') ? 'border-red-500' : ''}
                      />
                      {getError('name') && (
                        <span className="text-red-500 text-xs">{getError('name')}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fantasyName">Nome Fantasia</Label>
                      <Input
                        id="fantasyName"
                        name="fantasyName"
                        value={companyFields.fantasyName}
                        onChange={(e) =>
                          setCompanyFields({ ...companyFields, fantasyName: e.target.value })
                        }
                        placeholder="Nome Fantasia"
                        className={getError('fantasyName') ? 'border-red-500' : ''}
                      />
                      {getError('fantasyName') && (
                        <span className="text-red-500 text-xs">{getError('fantasyName')}</span>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="stateRegistration">Inscrição Estadual (Opcional)</Label>
                      <Input
                        id="stateRegistration"
                        name="stateRegistration"
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min="0"
                        defaultValue={initialData?.stateRegistration ?? ''}
                        placeholder="Somente números"
                        className={getError('stateRegistration') ? 'border-red-500' : ''}
                      />
                      {getError('stateRegistration') && (
                        <span className="text-red-500 text-xs">
                          {getError('stateRegistration')}
                        </span>
                      )}
                    </div>
                  </>
                )}

                {personType === 'FISICA' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={initialData?.name}
                        placeholder="Nome do Cliente"
                        className={getError('name') ? 'border-red-500' : ''}
                      />
                      {getError('name') && (
                        <span className="text-red-500 text-xs">{getError('name')}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document">CPF</Label>
                      <Input
                        id="document"
                        name="document"
                        defaultValue={initialData?.document ? maskCPF(initialData.document) : ''}
                        placeholder="000.000.000-00"
                        disabled={isEditing}
                        maxLength={14}
                        onChange={(e) => handleMask(e, maskCPF)}
                        className={getError('document') ? 'border-red-500' : ''}
                      />
                      {getError('document') && (
                        <span className="text-red-500 text-xs">{getError('document')}</span>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="rg">RG (Opcional)</Label>
                      <Input
                        id="rg"
                        name="rg"
                        defaultValue={initialData?.rg ? maskOnlyNumbers(initialData.rg) : ''}
                        placeholder="RG"
                        onChange={(e) => handleMask(e, maskOnlyNumbers)}
                        className={getError('rg') ? 'border-red-500' : ''}
                      />
                      {getError('rg') && (
                        <span className="text-red-500 text-xs">{getError('rg')}</span>
                      )}
                    </div>
                  </>
                )}

                {personType === 'ESTRANGEIRO' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={initialData?.name}
                        placeholder="Nome do Cliente"
                        className={getError('name') ? 'border-red-500' : ''}
                      />
                      {getError('name') && (
                        <span className="text-red-500 text-xs">{getError('name')}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document">Documento</Label>
                      <Input
                        id="document"
                        name="document"
                        defaultValue={initialData?.document}
                        placeholder="Documento de Identificação"
                        className={getError('document') ? 'border-red-500' : ''}
                      />
                      {getError('document') && (
                        <span className="text-red-500 text-xs">{getError('document')}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Seção: Contato */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Opcional)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={contactFields.email}
                    onChange={(e) => setContactFields({ ...contactFields, email: e.target.value })}
                    placeholder="cliente@exemplo.com"
                    className={getError('email') ? 'border-red-500' : ''}
                  />
                  {getError('email') && (
                    <span className="text-red-500 text-xs">{getError('email')}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={contactFields.phone}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    onChange={(e) => {
                      const masked = maskPhone(e.target.value);
                      e.target.value = masked;
                      setContactFields({ ...contactFields, phone: masked });
                    }}
                    className={getError('phone') ? 'border-red-500' : ''}
                  />
                  {getError('phone') && (
                    <span className="text-red-500 text-xs">{getError('phone')}</span>
                  )}
                </div>

                <div className="flex items-center space-x-2 md:col-span-2">
                  <Checkbox
                    id="isWhatsapp"
                    name="isWhatsapp"
                    defaultChecked={initialData?.isWhatsapp || true}
                  />
                  <Label htmlFor="isWhatsapp">Este telefone é WhatsApp?</Label>
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
                      value={addressFields.cep}
                      placeholder="00000-000"
                      maxLength={9}
                      onChange={(e) => {
                        const masked = maskCEP(e.target.value);
                        setAddressFields({ ...addressFields, cep: masked });
                        const cleanCEP = e.target.value.replace(/\D/g, '');
                        if (cleanCEP.length === 8) {
                          handleCEPChange(cleanCEP);
                        }
                      }}
                      className={getError('cep') ? 'border-red-500' : ''}
                      disabled={isLoadingCEP}
                    />
                    {isLoadingCEP && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {getError('cep') && (
                    <span className="text-red-500 text-xs">{getError('cep')}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressType">Tipo de Endereço (Opcional)</Label>
                  <Select name="addressType" defaultValue={initialData?.addressType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMERCIAL">Comercial</SelectItem>
                      <SelectItem value="RESIDENCIAL">Residencial</SelectItem>
                    </SelectContent>
                  </Select>
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
                    value={addressFields.addressNumber}
                    onChange={(e) =>
                      setAddressFields({ ...addressFields, addressNumber: e.target.value })
                    }
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
                    defaultValue={initialData?.complement}
                    placeholder="Apto, Bloco, etc."
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

                <div className="space-y-2 md:col-span-2">
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

            {/* Seção: Observações */}
            <div className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="notes">Observações (Opcional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={initialData?.notes}
                  placeholder="Observações adicionais"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-0 flex flex-col gap-2 sticky bottom-0 z-10 mt-auto border-t">
            <div className="flex w-full bg-background/35 backdrop-blur-sm py-2 px-4 gap-2">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Salvando...' : isEditing ? 'Atualizar Cliente' : 'Criar Cliente'}
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
      </Card>

      {isEditing && (
        <ClientActionDialogs
          id={id!}
          isDeleteOpen={isDeleteOpen}
          setIsDeleteOpen={setIsDeleteOpen}
        />
      )}
    </>
  );
}
