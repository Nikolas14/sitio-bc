'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { IOperation } from '@/types';

export function useTransactionItems(transactionId: string | null) {
  const [items, setItems] = useState<IOperation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      Promise.resolve().then(() => setItems([]));
      return;
    }

    Promise.resolve().then(() => setLoading(true));
    supabase
      .from('ESTOQUE_operation')
      .select(`*, ESTOQUE_product(name, price)`)
      .eq('transaction_id', transactionId)
      .then(({ data, error }) => {
        if (error) console.error('Erro ao buscar itens:', error);

        setItems((data as unknown as IOperation[]) || []);
        setLoading(false);
      });
  }, [transactionId]);

  return { items, loading };
}