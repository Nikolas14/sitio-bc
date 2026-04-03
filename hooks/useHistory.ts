import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';

export type Period = 'yesterday' | '3d' | '7d' | '30d' | 'all';

export function useHistory(productId: number | null, period: Period) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!productId) {
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('ESTOQUE_operation')
        .select(`
          id,
          type,
          quant,
          created_at,
          ESTOQUE_transaction (
            customer_vendor,
            serial_number
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      // Lógica de Filtro por Período
      if (period !== 'all') {
        const dateLimit = new Date();
        if (period === 'yesterday') {
          dateLimit.setDate(dateLimit.getDate() - 1);
          dateLimit.setHours(0, 0, 0, 0);
        } else {
          const days = period === '3d' ? 3 : period === '7d' ? 7 : 30;
          dateLimit.setDate(dateLimit.getDate() - days);
        }
        query = query.gte('created_at', dateLimit.toISOString());
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) throw supabaseError;

      setHistory(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar histórico:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId, period]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refresh: fetchHistory };
}