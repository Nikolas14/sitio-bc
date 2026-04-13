'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/api/supabase';

export function usePickingSummary() {
  const [projections, setProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ESTOQUE_projection')
      .select(`quant, ESTOQUE_product ( id, name )`)
      .eq('status', 'ABERTO');

    setProjections(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const consolidated = useMemo(() => {
    const map = new Map();
    projections.forEach(item => {
      const prodId = item.ESTOQUE_product?.id;
      const name = item.ESTOQUE_product?.name;
      const current = map.get(prodId) || { name, total: 0 };
      
      map.set(prodId, {
        name,
        total: current.total + Number(item.quant)
      });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [projections]);

  const totalGeral = useMemo(() => 
    consolidated.reduce((acc, curr) => acc + curr.total, 0)
  , [consolidated]);

  return { consolidated, totalGeral, loading, refresh: fetchData };
}