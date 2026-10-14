import { IProduct } from '@/types';

export interface IAdjustmentLine {
  productId: number;
  name: string;
  type?: string;
  price: number;
  systemKg: number;
  countedKg: number;
  diffKg: number;
}

// Pesos de balança têm 2 casas; 3 casas elimina o ruído de ponto flutuante das somas.
export const roundKg = (value: number) => Math.round(value * 1000) / 1000;

// Categorias fora da conferência: saldo nunca é comparado nem ajustado.
export const TIPOS_FORA_CONFERENCIA = ['ISOPOR'];

export const isCountable = (p: IProduct) =>
  !TIPOS_FORA_CONFERENCIA.includes((p.type || '').toUpperCase());

// Conferência total: todo produto das categorias conferidas entra na comparação.
// Produto não bipado conta como 0 kg (o saldo dele vai a zero).
export function buildAdjustmentLines(
  products: IProduct[],
  countedByProduct: Record<number, number>
): IAdjustmentLine[] {
  return products.filter(isCountable).map((p) => {
    const systemKg = roundKg(Number(p.current_stock) || 0);
    const countedKg = roundKg(countedByProduct[p.id] || 0);
    return {
      productId: p.id,
      name: p.name,
      type: p.type,
      price: Number(p.price) || 0,
      systemKg,
      countedKg,
      diffKg: roundKg(countedKg - systemKg),
    };
  });
}

export function summarizeAdjustment(lines: IAdjustmentLine[]) {
  const entradas = lines.filter((l) => l.diffKg > 0);
  const saidas = lines.filter((l) => l.diffKg < 0);
  return {
    entradas: entradas.length,
    saidas: saidas.length,
    entradaKg: roundKg(entradas.reduce((acc, l) => acc + l.diffKg, 0)),
    saidaKg: roundKg(saidas.reduce((acc, l) => acc - l.diffKg, 0)),
  };
}
