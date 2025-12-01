export interface OpenCNPJResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  matriz_filial: string;
  data_inicio_atividade: string;
  cnae_principal: string;
  cnaes_secundarios: string[];
  cnaes_secundarios_count: number;
  natureza_juridica: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  email: string;
  telefones: Array<{
    ddd: string;
    numero: string;
    is_fax: boolean;
  }>;
  capital_social: string;
  porte_empresa: string;
  opcao_simples: string | null;
  data_opcao_simples: string | null;
  opcao_mei: string | null;
  data_opcao_mei: string | null;
  QSA: Array<{
    nome_socio: string;
    cnpj_cpf_socio: string;
    qualificacao_socio: string;
    data_entrada_sociedade: string;
    identificador_socio: string;
    faixa_etaria: string;
  }>;
}

export interface CNPJData {
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  dataSituacaoCadastral: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  telefone: string;
  email: string;
}

/**
 * Fetches company data from OpenCNPJ API based on the provided CNPJ
 * @param cnpj - Brazilian CNPJ (can be formatted or unformatted)
 * @returns Company data or null if CNPJ is invalid or API fails
 */
export async function fetchCNPJData(cnpj: string): Promise<CNPJData | null> {
  try {
    // Remove formatting from CNPJ (keep only numbers)
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Validate CNPJ length
    if (cleanCNPJ.length !== 14) {
      return null;
    }

    const response = await fetch(`https://api.opencnpj.org/${cleanCNPJ}`);

    if (!response.ok) {
      console.error('OpenCNPJ API error:', response.statusText);
      return null;
    }

    const data: OpenCNPJResponse = await response.json();
    console.log('🚀 ~ fetchCNPJData ~ data:', data);

    // Assuming the API returns data; if erro, handle accordingly
    // The API might not have an 'erro' field, but if not found, perhaps empty or error status

    return {
      razaoSocial: data.razao_social,
      nomeFantasia: data.nome_fantasia,
      situacaoCadastral: data.situacao_cadastral,
      dataSituacaoCadastral: data.data_situacao_cadastral,
      cep: data.cep,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      telefone:
        data.telefones.length > 0 ? `${data.telefones[0].ddd}${data.telefones[0].numero}` : '',
      email: data.email,
    };
  } catch (error) {
    console.error('Error fetching data from OpenCNPJ:', error);
    return null;
  }
}
