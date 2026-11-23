import type { IBoleto } from '@/types';

export type StatusBoleto = 'PAGO' | 'VENCIDO' | 'VENCE_EM_BREVE' | 'EM_ABERTO';

export const BANCOS_SUGERIDOS = [
  'Banco do Brasil',
  'Bradesco',
  'Caixa',
  'Itaú',
  'Santander',
  'Sicoob',
  'Sicredi',
  'Nubank',
  'Inter',
];

const DIAS_VENCE_EM_BREVE = 7;

const formatarData = (data: Date) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

/** Data de hoje no fuso do usuário, em YYYY-MM-DD (não usar toISOString: é UTC). */
export function hojeLocal(): string {
  return formatarData(new Date());
}

/** Status de um boleto. `hoje` é YYYY-MM-DD; comparação por string funciona nesse formato. */
export function statusBoleto(boleto: IBoleto, hoje: string): StatusBoleto {
  if (boleto.paid_at) return 'PAGO';
  if (boleto.vencimento < hoje) return 'VENCIDO';

  const [ano, mes, dia] = hoje.split('-').map(Number);
  const limite = formatarData(new Date(ano, mes - 1, dia + DIAS_VENCE_EM_BREVE));
  if (boleto.vencimento <= limite) return 'VENCE_EM_BREVE';

  return 'EM_ABERTO';
}

/**
 * Converte o valor digitado no formato brasileiro ("1.500,00", "150", "150,5") em número.
 * O ponto é sempre separador de milhar; a vírgula é o decimal. Retorna null se inválido ou não positivo.
 */
export function parseValor(texto: string): number | null {
  const limpo = texto.trim().replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;

  const valor = Number(limpo);
  if (!Number.isFinite(valor) || valor <= 0) return null;
  return Math.round(valor * 100) / 100;
}

// Fornecedores que aparecem nas sugestões mesmo antes do primeiro boleto deles.
export const FORNECEDORES_INICIAIS: string[] = [];

/** Sugestões do campo EMPRESA: a lista fixa inicial mais as empresas já cadastradas em boletos, sem repetir. */
export function sugestoesEmpresa(
  boletos: Pick<IBoleto, 'empresa'>[],
  iniciais: string[] = FORNECEDORES_INICIAIS,
): string[] {
  const nomes = [...iniciais, ...boletos.map((boleto) => boleto.empresa)]
    .map((nome) => nome.trim().toUpperCase())
    .filter(Boolean);
  return [...new Set(nomes)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** Primeira mensagem de erro do cadastro, ou null se estiver tudo certo. */
export function validarFormulario(form: { numero: string; empresa: string; valor: string }): string | null {
  if (!form.numero.trim()) return 'Preencha o número do boleto.';
  if (!form.empresa.trim()) return 'Preencha a empresa.';
  if (parseValor(form.valor) === null) return 'Valor inválido.';
  return null;
}
