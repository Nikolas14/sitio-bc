'use client';

import { useState, useEffect, useCallback } from 'react';
import { IProductBalance } from '@/types';
import { supabase } from '@/api/supabase';

export const useInventory = () => {
  const [products, setProducts] = useState<IProductBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshStock = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_stock_balance_new')
        .select('*')
        .order('name', { ascending: true })
        .returns<IProductBalance[]>();

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Erro ao carregar estoque:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStock();
  }, [refreshStock]);

  return { products, loading, refreshStock };
};