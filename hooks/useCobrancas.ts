import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { ITransaction } from '@/types';

export function useCobrancas() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCobrancas = useCallback(async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('ESTOQUE_transaction')
        .select('*')
        .eq('type', 'OUT') // Somente vendas
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      setTransactions((data as ITransaction[]) || []);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCobrancas();
  }, [fetchCobrancas]);

  return {
    transactions,
    loading,
    error,
    refresh: fetchCobrancas
  };
}