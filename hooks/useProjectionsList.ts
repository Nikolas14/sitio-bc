'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/api/supabase';

export interface IProjectionItem {
  id: string;
  created_at: string;
  product_id: number;
  quant: number;
  reference: string;
  status: string;
  ESTOQUE_product: {
    name: string;
  };
}

export function useProjectionsList() {
  const [projections, setProjections] = useState<IProjectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ESTOQUE_projection')
      .select(`*, ESTOQUE_product ( name )`)
      .order('created_at', { ascending: false });

    if (!error) {
      setProjections(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  // Agrupa os itens por referência automaticamente
  const groupedProjections = useMemo(() => {
    return projections.reduce((acc: Record<string, IProjectionItem[]>, item) => {
      const ref = item.reference || 'Sem Referência';
      if (!acc[ref]) acc[ref] = [];
      acc[ref].push(item);
      return acc;
    }, {});
  }, [projections]);

  return {
    projections,
    groupedProjections,
    loading,
    refresh: fetchProjections
  };
}