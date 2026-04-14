'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { ITransaction } from '@/types';

export function useCobranca(id: string | string[] | undefined) {
  const [trans, setTrans] = useState<ITransaction | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Busca o cabeçalho
      const { data: tData, error: tError } = await supabase
        .from('ESTOQUE_transaction')
        .select('*')
        .eq('id', id)
        .single();

      if (tError) throw tError;

      // 2. Busca os itens
      const { data: iData, error: iError } = await supabase
        .from('ESTOQUE_operation')
        .select('quant, ESTOQUE_product(name, price)')
        .eq('transaction_id', id);

      if (iError) throw iError;

      // O 'as ITransaction' resolve o erro de tipagem na atribuição
      setTrans(tData as ITransaction);
      setItems(iData || []);
    } catch (err: any) {
      console.error("Erro ao carregar detalhes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { trans, items, loading, error, refresh: fetchData, setTrans };
}