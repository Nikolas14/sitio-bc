// Configurações do sistema, guardadas em ESTOQUE_configuracao (uma linha por chave, valor em jsonb).

export interface Configuracoes {
  empresas: string[];
  bancos: string[];
  diasVenceEmBreve: number;
  descontoFrango: number;
  acrescimoFreteKg: number;
}

export interface LinhaConfiguracao {
  chave: string;
  valor: unknown;
}

// Nome da chave no banco para cada campo.
const CHAVES: Record<keyof Configuracoes, string> = {
  empresas: 'empresas',
  bancos: 'bancos',
  diasVenceEmBreve: 'dias_vence_em_breve',
  descontoFrango: 'desconto_frango',
  acrescimoFreteKg: 'acrescimo_frete_kg',
};

const ehListaDeTextos = (valor: unknown): valor is string[] =>
  Array.isArray(valor) && valor.every((item) => typeof item === 'string');

const ehNumero = (valor: unknown): valor is number => typeof valor === 'number' && Number.isFinite(valor);

/** Monta as configurações a partir das linhas do banco. Retorna null se alguma chave estiver faltando ou com tipo errado. */
export function montarConfiguracoes(linhas: LinhaConfiguracao[]): Configuracoes | null {
  const porChave = new Map(linhas.map((linha) => [linha.chave, linha.valor]));

  const empresas = porChave.get(CHAVES.empresas);
  const bancos = porChave.get(CHAVES.bancos);
  const dias = porChave.get(CHAVES.diasVenceEmBreve);
  const desconto = porChave.get(CHAVES.descontoFrango);
  const acrescimo = porChave.get(CHAVES.acrescimoFreteKg);

  if (!ehListaDeTextos(empresas) || !ehListaDeTextos(bancos)) return null;
  if (!ehNumero(dias) || !ehNumero(desconto) || !ehNumero(acrescimo)) return null;

  return {
    empresas,
    bancos,
    diasVenceEmBreve: dias,
    descontoFrango: desconto,
    acrescimoFreteKg: acrescimo,
  };
}

/** Converte as configurações em linhas para gravar no banco. */
export function paraLinhasConfiguracoes(config: Configuracoes): LinhaConfiguracao[] {
  return [
    { chave: CHAVES.empresas, valor: config.empresas },
    { chave: CHAVES.bancos, valor: config.bancos },
    { chave: CHAVES.diasVenceEmBreve, valor: config.diasVenceEmBreve },
    { chave: CHAVES.descontoFrango, valor: config.descontoFrango },
    { chave: CHAVES.acrescimoFreteKg, valor: config.acrescimoFreteKg },
  ];
}
