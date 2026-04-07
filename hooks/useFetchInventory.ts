'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { IProduct } from '@/types';

// Interface baseada na sua View de Sumário
export interface IInventorySummary {
    product: IProduct
    current_stock: number;
}

export function useFetchInventory() {
    const [data, setData] = useState<IInventorySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const { data: viewData, error: err } = await supabase
                .from('ESTOQUE_v_inventory_summary') // Nome da sua View
                .select('*');

            if (err) throw err;
            setData(viewData || []);
        } catch (e: any) {
            setError(e.message);
            console.error("Erro na View de Inventário:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    return { inventory: data, loading, error, refresh: fetchInventory };
}