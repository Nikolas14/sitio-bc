'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/api/supabase';

interface PickingProjection {
  quant: number | string;
  ESTOQUE_product?: { id: number | string; name: string } | null;
}

interface ConsolidatedItem {
  name: string;
  total: number;
}

export function usePickingSummary() {
  const [projections, setProjections] = useState<PickingProjection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ESTOQUE_projection')
      .select(`quant, ESTOQUE_product ( id, name )`)
      .eq('status', 'ABERTO');

    setProjections((data as unknown as PickingProjection[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase
      .from('ESTOQUE_projection')
      .select(`quant, ESTOQUE_product ( id, name )`)
      .eq('status', 'ABERTO')
      .then(({ data }) => {
        setProjections((data as unknown as PickingProjection[]) || []);
        setLoading(false);
      });
  }, []);

  const consolidated = useMemo(() => {
    const map = new Map<number | string | undefined, ConsolidatedItem>();
    projections.forEach(item => {
      const prodId = item.ESTOQUE_product?.id;
      const name = item.ESTOQUE_product?.name ?? 'Desconhecido';
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