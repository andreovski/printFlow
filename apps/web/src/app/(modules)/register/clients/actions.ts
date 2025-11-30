'use server';

import { createClientBodySchema, updateClientBodySchema } from '@magic-system/schemas';
import { HTTPError } from 'ky';
import { revalidateTag } from 'next/cache';

import { createClient, updateClient, deleteClient } from '@/app/http/requests/clients';
import { validateDocument } from '@/lib/document';

export async function createClientAction(formData: FormData) {
  const cleanNumber = (value: string | null) => (value ? value.replace(/\D/g, '') : undefined);
  const optionalString = (value: string | null) => (value ? value : undefined);

  const rawData = {
    name: formData.get('name') as string,
    fantasyName: optionalString(formData.get('fantasyName') as string),
    email: optionalString(formData.get('email') as string),
    personType: formData.get('personType') as 'FISICA' | 'JURIDICA' | 'ESTRANGEIRO',
    document: cleanNumber(formData.get('document') as string) as string,
    phone: cleanNumber(formData.get('phone') as string) as string,
    isWhatsapp: formData.get('isWhatsapp') === 'true' || formData.get('isWhatsapp') === 'on',
    rg: cleanNumber(formData.get('rg') as string),
    cep: cleanNumber(formData.get('cep') as string) as string,
    addressType: optionalString(formData.get('addressType') as string) as
      | 'COMERCIAL'
      | 'RESIDENCIAL'
      | undefined,
    address: formData.get('address') as string,
    addressNumber: formData.get('addressNumber') as string,
    complement: optionalString(formData.get('complement') as string),
    neighborhood: optionalString(formData.get('neighborhood') as string),
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    country: formData.get('country') as string,
    notes: optionalString(formData.get('notes') as string),
    active: true,
  };

  const validation = createClientBodySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const isValidDocument = validateDocument(validation.data.document, validation.data.personType);

  if (!isValidDocument) {
    return {
      success: false,
      message: 'Documento inválido',
      errors: {
        document: ['Documento inválido'],
      },
    };
  }

  try {
    await createClient(validation.data);

    revalidateTag('clients');
    return { success: true, message: 'Cliente criado com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao criar cliente.';
      try {
        const errorData = await err.response.json();
        message = errorData.message || message;
      } catch (_e) {
        console.error('Error parsing error response:', _e);
      }
      return {
        success: false,
        message,
        errors: [],
      };
    }
    return { success: false, message: 'Something went wrong', errors: null };
  }
}

export async function updateClientAction(formData: FormData, id: string) {
  const cleanNumber = (value: string | null) => (value ? value.replace(/\D/g, '') : undefined);
  const optionalString = (value: string | null) => (value ? value : undefined);

  const rawData = {
    name: formData.get('name') as string,
    fantasyName: optionalString(formData.get('fantasyName') as string),
    email: optionalString(formData.get('email') as string),
    personType: formData.get('personType') as 'FISICA' | 'JURIDICA' | 'ESTRANGEIRO',
    document: cleanNumber(formData.get('document') as string),
    phone: cleanNumber(formData.get('phone') as string),
    isWhatsapp: formData.get('isWhatsapp') === 'true' || formData.get('isWhatsapp') === 'on',
    rg: cleanNumber(formData.get('rg') as string),
    cep: cleanNumber(formData.get('cep') as string),
    addressType: optionalString(formData.get('addressType') as string) as
      | 'COMERCIAL'
      | 'RESIDENCIAL'
      | undefined,
    address: formData.get('address') as string,
    addressNumber: formData.get('addressNumber') as string,
    complement: optionalString(formData.get('complement') as string),
    neighborhood: optionalString(formData.get('neighborhood') as string),
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    country: formData.get('country') as string,
    notes: optionalString(formData.get('notes') as string),
    active: formData.get('active') === 'true',
  };

  const validation = updateClientBodySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await updateClient({ id, ...validation.data });

    revalidateTag('clients');
    return { success: true, message: 'Cliente atualizado com sucesso!', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Failed to update client';
      try {
        const errorData = await err.response.json();
        message = errorData.message || message;
      } catch (_e) {
        console.error('Error parsing error response:', _e);
      }
      return {
        success: false,
        message,
        errors: null,
      };
    }
    return { success: false, message: 'Something went wrong', errors: null };
  }
}

export async function deleteClientAction(id: string) {
  try {
    await deleteClient(id);

    revalidateTag('clients');

    return {
      success: true,
      message: 'Cliente deletado com sucesso',
      errors: null,
    };
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorData = await err.response.json();
      return {
        success: false,
        message: errorData.message || 'Falha ao deletar cliente',
        errors: null,
      };
    }
    return { success: false, message: 'Algo deu errado', errors: null };
  }
}
