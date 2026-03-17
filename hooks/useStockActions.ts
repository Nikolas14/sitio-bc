'use client';

import { useState } from 'react';
import { supabase } from '@/api/supabase';
import { IOperation } from '@/types';

export const useStockActions = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Registra uma única operação (Unitária)
   */
  const registerOperation = async (op: IOperation) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('operation_new')
        .insert([
          {
            product_id: op.product_id,
            type: op.type,
            quant: op.quant,
            customer: op.customer || 'Venda Avulsa',
            date: new Date().toISOString(),
          },
        ]);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Erro na operação unitária:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registra várias operações de uma vez (Lote/Batch)
   * Ideal para quando você bipa várias etiquetas na balança
   */
  const registerBatchOperations = async (operations: IOperation[]) => {
    setLoading(true);
    try {
      // Mapeamos o array para o formato que o banco espera
      const payload = operations.map(op => ({
        product_id: op.product_id,
        type: op.type,
        quant: op.quant,
        customer: op.customer || 'Venda em Lote',
        date: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('operation_new')
        .insert(payload);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Erro no registro em lote:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    registerOperation, 
    registerBatchOperations, 
    loading 
  };
};