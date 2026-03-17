'use client';

import { supabase } from '@/api/supabase';
import { IOperation } from '@/types';

export const useStockActions = () => {
  const registerOperation = async (op: IOperation) => {
    const { data, error } = await supabase
      .from('operation_new')
      .insert([
        {
          product_id: op.product_id,
          type: op.type,
          quant: op.quant,
          customer: op.customer || 'Balcão',
          date: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error("Erro ao registrar operação:", error);
      throw error;
    }

    return data;
  };

  return { registerOperation };
};