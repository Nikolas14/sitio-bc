'use client';

import { supabase } from '@/api/supabase';

export function useDeleteTransaction() {
  const deleteTransaction = async (transactionId: string) => {
    try {
      const { error: operationsError } = await supabase
        .from('ESTOQUE_operation')
        .delete()
        .eq('transaction_id', transactionId);

      if (operationsError) throw operationsError;

      const { error } = await supabase
        .from('ESTOQUE_transaction')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  return { deleteTransaction };
}