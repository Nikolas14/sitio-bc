'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';

interface AvailabilityRow {
  product_id: number | string;
  product_name: string;
  estoque_real: number;
  total_projetado: number;
  saldo_previsto: number;
  type?: string;
}

export function useAvailability() {
  const [data, setData] = useState<AvailabilityRow[]>([]);
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

    if (viewResult) setData(viewResult as AvailabilityRow[]);

    if (productResult) {
      const uniqueTypes = Array.from(
        new Set(productResult.map(p => p.type).filter(Boolean))
      ) as string[];
      setCategories(uniqueTypes.sort());
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    supabase
      .from('ESTOQUE_v_estoque_vs_projecao')
      .select('*')
      .order('saldo_previsto', { ascending: true })
      .then(({ data: viewResult }) => {
        if (viewResult) setData(viewResult as AvailabilityRow[]);
        return supabase.from('ESTOQUE_product').select('type');
      })
      .then(({ data: productResult }) => {
        if (productResult) {
          const uniqueTypes = Array.from(
            new Set(productResult.map(p => p.type).filter(Boolean))
          ) as string[];
          setCategories(uniqueTypes.sort());
        }
        setLoading(false);
      });
  }, []);

  return { data, categories, loading, refresh: fetchData };
}