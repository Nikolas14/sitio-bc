import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/api/supabase';

export function useCobrancas() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCobrancas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('ESTOQUE_transaction')
        .select('*')
        .eq('type', 'OUT') // Somente vendas
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

    //   console.log("💰 Cobranças carregadas:", data);
      setTransactions(data || []);
      
    } catch (err: any) {
      console.error('Erro no Hook useCobrancas:', err);
      setError(err.message);
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
}''