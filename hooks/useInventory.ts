import { useEffect, useState } from 'react';
import { supabase } from '@/api/supabase';

export function useInventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchInventory() {
    try {
      setLoading(true);
      // Alterado para a nova View que criamos
      const { data, error: supabaseError } = await supabase
        .from('ESTOQUE_v_inventory_summary')
        .select('*')
        .order('name', { ascending: true });

      if (supabaseError) throw supabaseError;

      setProducts(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar estoque:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInventory();
  }, []);

  return { products, loading, error, refresh: fetchInventory };
}