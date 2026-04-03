'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase';

export function useTransactionItems(transactionId: string | null) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!transactionId) {
      setItems([]);
      return;
    }

    async function fetchItems() {
      setLoading(true);
      const { data, error } = await supabase
        .from('ESTOQUE_operation')
        .select(`*, ESTOQUE_product(name, price)`)
        .eq('transaction_id', transactionId);

      if (error) console.error('Erro ao buscar itens:', error);
      
      setItems(data || []);
      setLoading(false);
    }

    fetchItems();
  }, [transactionId]);

  return { items, loading };
}