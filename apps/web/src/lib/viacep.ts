export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Fetches address data from ViaCEP API based on the provided CEP
 * @param cep - Brazilian postal code (can be formatted or unformatted)
 * @returns Address data or null if CEP is invalid or API fails
 */
export async function fetchAddressByCEP(cep: string): Promise<AddressData | null> {
  try {
    // Remove formatting from CEP (keep only numbers)
    const cleanCEP = cep.replace(/\D/g, '');

    // Validate CEP length
    if (cleanCEP.length !== 8) {
      return null;
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);

    if (!response.ok) {
      console.error('ViaCEP API error:', response.statusText);
      return null;
    }

    const data: ViaCEPResponse = await response.json();

    // Check if CEP was not found
    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch (error) {
    console.error('Error fetching address from ViaCEP:', error);
    return null;
  }
}
