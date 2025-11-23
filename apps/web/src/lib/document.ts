export const validateDocument = (document: string, type: 'FISICA' | 'JURIDICA' | 'ESTRANGEIRO') => {
  const cleanDocument = document.replace(/[\.\-]/g, '');

  if (type === 'FISICA') {
    return checkCPF(cleanDocument);
  }
  if (type === 'JURIDICA') {
    return checkCNPJ(cleanDocument);
  }
  return true;
};

export function checkCPF(cpf: string) {
  if (cpf.length !== 11) return false;

  const cpfDigits = cpf.split('').map((el) => +el);

  const calculateVerifierDigit = (start: number, length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += cpfDigits[i] * (start - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === 11 ? 0 : remainder;
  };

  const firstVerifier = calculateVerifierDigit(10, 9);
  if (firstVerifier !== cpfDigits[9]) return false;

  const secondVerifier = calculateVerifierDigit(11, 10);
  if (secondVerifier !== cpfDigits[10]) return false;

  return true;
}

export function checkCNPJ(cnpj: string) {
  if (cnpj.length !== 14) return false;

  const cnpjDigits = cnpj.split('').map((el) => +el);

  const calculateVerifierDigit = (start: number, length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += cnpjDigits[i] * (start - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === 11 ? 0 : remainder;
  };

  const firstVerifier = calculateVerifierDigit(5, 8);
  if (firstVerifier !== cnpjDigits[8]) return false;

  const secondVerifier = calculateVerifierDigit(6, 9);
  if (secondVerifier !== cnpjDigits[9]) return false;

  return true;
}
