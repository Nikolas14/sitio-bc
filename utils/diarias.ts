// Aceita "150", "150,00", "150.00" e "R$ 1.500,00". Vazio vira null; texto inválido vira undefined.
// Extras podem ser negativos (ex.: "-20"); diárias não.
export function parseValor(text: string, permitirNegativo = false): number | null | undefined {
  const clean = text.replace(/[R$\s]/g, '');
  if (clean === '') return null;
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return undefined;
  return value >= 0 || permitirNegativo ? value : undefined;
}

export function formatReais(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface PagamentoDia {
  diarias: number; // soma das diárias dos abates em que a pessoa foi
  desconto: number; // desconto por ter recebido frango
  extra: number; // valor extra lançado para a pessoa (pode ser negativo)
  total: number; // diárias menos o desconto, mais o extra
}

/**
 * Quanto uma pessoa recebe na semana. Cada diária conta só no abate em que ela foi (presente nele).
 * O desconto conta se ela foi no frango e recebeu frango. O extra conta sempre.
 */
export function calcularPagamento(
  foi: { frango: boolean; boi: boolean },
  receivedChicken: boolean,
  valores: { frango: number; boi: number },
  extra: number,
  descontoFrango: number,
): PagamentoDia {
  const diarias = (foi.frango ? valores.frango : 0) + (foi.boi ? valores.boi : 0);
  const desconto = foi.frango && receivedChicken ? descontoFrango : 0;
  return { diarias, desconto, extra, total: diarias - desconto + extra };
}
