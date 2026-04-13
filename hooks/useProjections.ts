'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';

export interface IProjection {
  id: string;
  created_at: string;
  product_id: number;
  quant: number;
  reference: string;
  status: 'ABERTO' | 'PROCESSADO' | 'CANCELADO';
  ESTOQUE_product?: {
    name: string;
  };
}

export function useProjections() {
  const [projections, setProjections] = useState<IProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from('ESTOQUE_projection')
        .select(`
          *,
          ESTOQUE_product (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;

      setProjections(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar projeções:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  return { projections, loading, error, refresh: fetchProjections, setProjections };
}