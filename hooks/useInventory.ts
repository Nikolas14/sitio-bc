import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { IProduct } from '@/types';

export function useInventory() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      await Promise.resolve();
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('ESTOQUE_v_inventory_summary')
        .select('*')
        .order('name', { ascending: true });

      if (supabaseError) throw supabaseError;

      // --- LOG DE DEBUG (O lado 'Fetch' do híbrido) ---
      // console.log("📦 View Supabase:", data);

      // Forçamos a tipagem para garantir que o array siga a interface IProduct
      setProducts((data as IProduct[]) || []);

    } catch (err: unknown) {
      console.error('❌ Erro no Hook useInventory:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return { 
    products, 
    loading, 
    error, 
    refresh: fetchInventory 
  };
}