'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/api/supabase';
import {
  montarConfiguracoes,
  paraLinhasConfiguracoes,
  type Configuracoes,
  type LinhaConfiguracao,
} from '@/utils/configuracoes';

interface ConfiguracoesContextValue {
  /** null enquanto carrega (ou se o banco não tiver todas as chaves). */
  config: Configuracoes | null;
  error: string | null;
  /** Grava todas as configurações. Retorna a mensagem de erro, ou null se deu certo. */
  salvar: (novo: Configuracoes) => Promise<string | null>;
}

const ConfiguracoesContext = createContext<ConfiguracoesContextValue | null>(null);

// Carrega uma vez ao abrir o sistema e fica disponível para todas as telas.
export function ConfiguracoesProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Configuracoes | null>(null);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('ESTOQUE_configuracao').select('chave, valor');
    if (error) {
      setError(error.message);
      return;
    }
    const montada = montarConfiguracoes((data ?? []) as LinhaConfiguracao[]);
    if (montada) {
      setConfig(montada);
      setError(null);
    } else {
      setError('Configurações incompletas no banco.');
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void carregar();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [carregar]);

  const salvar = useCallback(async (novo: Configuracoes): Promise<string | null> => {
    const { error } = await supabase
      .from('ESTOQUE_configuracao')
      .upsert(
        paraLinhasConfiguracoes(novo).map((linha) => ({ ...linha, updated_at: new Date().toISOString() })),
        { onConflict: 'chave' },
      );
    if (error) return error.message;

    setConfig(novo);
    setError(null);
    return null;
  }, []);

  const value = useMemo(() => ({ config, error, salvar }), [config, error, salvar]);

  return <ConfiguracoesContext.Provider value={value}>{children}</ConfiguracoesContext.Provider>;
}

export function useConfiguracoes(): ConfiguracoesContextValue {
  const context = useContext(ConfiguracoesContext);
  if (!context) throw new Error('useConfiguracoes precisa estar dentro de ConfiguracoesProvider.');
  return context;
}
