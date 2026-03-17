/**
 * Extrai dados de um código EAN-13 padrão balança (começa com 2)
 * Exemplo: 2 0001 00150 0 -> ID 0001, Peso 1.50kg
 */
export const parseScaleBarcode = (code: string) => {
  const cleanCode = code.trim();

  if (cleanCode.length !== 13 || !cleanCode.startsWith('2')) {
    return null;
  }

  // Captura o ID do produto (posições 4 a 7 no seu padrão)
  // Substring 3 a 7 pega os 4 dígitos centrais
  const productId = parseInt(cleanCode.substring(3, 7), 10);

  // Captura o peso (posições 8 a 12)
  const weightRaw = parseInt(cleanCode.substring(7, 12), 10);

  // Divisor 100 conforme seu sistema original
  const weightKg = weightRaw / 100;

  if (isNaN(productId) || isNaN(weightKg)) return null;

  return { productId, weightKg };
};