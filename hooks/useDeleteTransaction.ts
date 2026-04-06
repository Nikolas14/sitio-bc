'use client';

import { supabase } from '@/api/supabase';

export function useDeleteTransaction() {
  const deleteTransaction = async (transactionId: string, items: any[], type: 'IN' | 'OUT') => {
    try {
      // 1. Estornar o estoque para cada item
      for (const item of items) {
        const factor = type === 'IN' ? -1 : 1; // Se era entrada, subtrai. Se era saída, devolve.
        const adjustment = Number(item.quant) * factor;

        const { data: product } = await supabase
          .from('ESTOQUE_product')
          .select('current_stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('ESTOQUE_product')
            .update({ current_stock: Number(product.current_stock) + adjustment })
            .eq('id', item.product_id);
        }
      }

      // 2. Deletar as operações (filhos)
      await supabase.from('ESTOQUE_operation').delete().eq('transaction_id', transactionId);

      // 3. Deletar a transação (pai)
      const { error } = await supabase.from('ESTOQUE_transaction').delete().eq('id', transactionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  return { deleteTransaction };
}