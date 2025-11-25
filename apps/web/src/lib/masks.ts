export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove non-digits
    .replace(/(\d{3})(\d)/, '$1.$2') // Add first dot
    .replace(/(\d{3})(\d)/, '$1.$2') // Add second dot
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Add dash
    .replace(/(-\d{2})\d+?$/, '$1'); // Limit to 11 digits
};

export const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove non-digits
    .replace(/(\d{2})(\d)/, '$1.$2') // Add first dot
    .replace(/(\d{3})(\d)/, '$1.$2') // Add second dot
    .replace(/(\d{3})(\d)/, '$1/$2') // Add slash
    .replace(/(\d{4})(\d)/, '$1-$2') // Add dash
    .replace(/(-\d{2})\d+?$/, '$1'); // Limit to 14 digits
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove non-digits
    .replace(/(\d{2})(\d)/, '($1) $2') // Add parenthesis
    .replace(/(\d{5})(\d)/, '$1-$2') // Add dash
    .replace(/(-\d{4})\d+?$/, '$1'); // Limit to 11 digits
};

export const maskOnlyNumbers = (value: string) => {
  return value.replace(/\D/g, ''); // Remove non-digits
};

export const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '') // Remove non-digits
    .replace(/(\d{5})(\d)/, '$1-$2') // Add dash
    .replace(/(-\d{3})\d+?$/, '$1'); // Limit to 8 digits
};

export const formatDocument = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 11) {
    return maskCPF(cleanValue);
  }
  return maskCNPJ(cleanValue);
};

export const formatPhone = (value: string) => {
  return maskPhone(value);
};

export const maskCurrency = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  const numberValue = Number(cleanValue) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numberValue);
};
