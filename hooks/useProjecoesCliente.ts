'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import type { IProjectionItem } from './useProjectionsList';

// Uma projeção = as linhas gravadas juntas num mesmo salvamento (mesma referência e mesmo created_at).
export interface IProjecaoGrupo {
  key: string;
  reference: string;
  createdAt: string;
  status: string;
  totalKg: number;
  items: IProjectionItem[];
}

const buscarProjecoes = (customerId: string) =>
  supabase
    .from('ESTOQUE_projection')
    .select('*, ESTOQUE_product ( name )')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

export function useProjecoesCliente(customerId: string) {
  const [projections, setProjections] = useState<IProjectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    buscarProjecoes(customerId).then(({ data, error: sbError }) => {
      if (sbError) setError(sbError.message);
      else setProjections((data as IProjectionItem[]) || []);
      setLoading(false);
    });
  }, [customerId]);

  const grupos = useMemo<IProjecaoGrupo[]>(() => {
    const map = new Map<string, IProjecaoGrupo>();

    projections.forEach(item => {
      const reference = item.reference || 'Sem Referência';
      const key = `${reference}|${item.created_at}`;
      const grupo = map.get(key) ?? { key, reference, createdAt: item.created_at, status: item.status, totalKg: 0, items: [] };
      grupo.items.push(item);
      grupo.totalKg += Number(item.quant) || 0;
      map.set(key, grupo);
    });

    return Array.from(map.values());
  }, [projections]);

  const toggleSelecao = (key: string) => {
    setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleTodas = () => {
    setSelectedKeys(prev => prev.length === grupos.length ? [] : grupos.map(g => g.key));
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: sbError } = await buscarProjecoes(customerId);
    if (sbError) setError(sbError.message);
    else {
      setError(null);
      setProjections((data as IProjectionItem[]) || []);
    }
    setLoading(false);
  }, [customerId]);

  // Exclui as linhas de todas as projeções marcadas. Retorna true se deu certo.
  const excluirSelecionadas = async (password: string): Promise<boolean> => {
    const { verifyAdminPassword } = await import('@/utils/adminAuth');
    const ok = await verifyAdminPassword(password);
    if (!ok) {
      setError('Senha incorreta!');
      return false;
    }

    const ids = grupos
      .filter(g => selectedKeys.includes(g.key))
      .flatMap(g => g.items.map(i => i.id));

    const { error: sbError } = await supabase
      .from('ESTOQUE_projection')
      .delete()
      .in('id', ids);

    if (sbError) {
      setError('Erro ao excluir.');
      return false;
    }

    setError(null);
    setSelectedKeys([]);
    await refresh();
    return true;
  };

  return {
    grupos,
    loading,
    error,
    selectedKeys,
    toggleSelecao,
    toggleTodas,
    excluirSelecionadas,
  };
}
