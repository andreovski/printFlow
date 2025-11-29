'use server';

import { updateCompanySettingsBodySchema } from '@magic-system/schemas';
import { HTTPError } from 'ky';
import { revalidateTag } from 'next/cache';

import { updateOrganization } from '@/app/http/requests/organization';

export async function updateCompanySettingsAction(formData: FormData) {
  const rawData = {
    cnpj: formData.get('cnpj') as string,
    enterpriseName: formData.get('enterpriseName') as string,
    fantasyName: formData.get('fantasyName') as string,
    mainEmail: formData.get('mainEmail') as string,
    mainPhone: formData.get('mainPhone') as string,
    cep: formData.get('cep') as string,
    address: formData.get('address') as string,
    addressNumber: formData.get('addressNumber') as string,
    complement: (formData.get('complement') as string) || undefined,
    neighborhood: (formData.get('neighborhood') as string) || undefined,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    country: (formData.get('country') as string) || 'Brasil',
  };

  const validation = updateCompanySettingsBodySchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    await updateOrganization(validation.data);

    revalidateTag('organization');
    return { success: true, message: 'Dados da empresa atualizados com sucesso', errors: null };
  } catch (err) {
    if (err instanceof HTTPError) {
      let message = 'Falha ao atualizar dados da empresa.';
      try {
        const errorData = await err.response.json();
        message = errorData.message || message;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      return {
        success: false,
        message,
        errors: null,
      };
    }
    return { success: false, message: 'Algo deu errado', errors: null };
  }
}
