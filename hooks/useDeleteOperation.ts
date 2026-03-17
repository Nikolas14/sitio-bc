'use client';

import { useState } from 'react';
import { supabase } from '@/api/supabase';

export const useDeleteOperation = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteOperation = async (operationId: string) => {
    const confirm = window.confirm("Tem certeza que deseja excluir esta movimentação? O stock será recalculado.");
    
    if (!confirm) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('operation_new')
        .delete()
        .eq('id', operationId);

      if (error) throw error;
      
      return true;
    } catch (err) {
      console.error("Erro ao eliminar operação:", err);
      alert("Não foi possível excluir a operação.");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteOperation, isDeleting };
};