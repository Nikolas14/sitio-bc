'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';

export function useAvailability() {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]); // Nova lista aqui
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Busca 1: Dados da View (Disponibilidade)
    const { data: viewResult } = await supabase
      .from('ESTOQUE_v_estoque_vs_projecao')
      .select('*')
      .order('saldo_previsto', { ascending: true });

    // Busca 2: Categorias da Tabela de Produtos
    const { data: productResult } = await supabase
      .from('ESTOQUE_product')
      .select('type');

    if (viewResult) setData(viewResult);
    
    if (productResult) {
      const uniqueTypes = Array.from(
        new Set(productResult.map(p => p.type).filter(Boolean))
      ) as string[];
      setCategories(uniqueTypes.sort());
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, categories, loading, refresh: fetchData };
}