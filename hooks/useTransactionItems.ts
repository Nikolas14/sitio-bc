'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { IOperation } from '@/types';

export function useTransactionItems(transactionId: string | null) {
  const [items, setItems] = useState<IOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      Promise.resolve().then(() => {
        setItems([]);
        setError(null);
      });
      return;
    }

    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
    });
    supabase
      .from('ESTOQUE_operation')
      .select(`*, ESTOQUE_product(name, price)`)
      .eq('transaction_id', transactionId)
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setItems((data as unknown as IOperation[]) || []);
        setLoading(false);
      });
  }, [transactionId]);

  return { items, loading, error };
}