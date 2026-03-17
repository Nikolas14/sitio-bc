'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { useDeleteOperation } from '@/hooks/useDeleteOperation';
import styles from './OperationHistory.module.css';

interface Props {
  productId: number;
  onUpdate: () => void;
}

export function OperationHistory({ productId, onUpdate }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const { deleteOperation, isDeleting } = useDeleteOperation();

  const loadHistory = useCallback(async () => {
    const { data } = await supabase
      .from('operation_new')
      .select('*')
      .eq('product_id', productId)
      .order('date', { ascending: false });
    
    setHistory(data || []);
  }, [productId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDelete = async (id: string) => {
    const success = await deleteOperation(id);
    if (success) {
      await loadHistory(); // Recarrega o histórico local
      onUpdate();          // Recarrega o saldo global da View
    }
  };

  if (history.length === 0) {
    return <div className={styles.item} style={{justifyContent: 'center', color: '#94a3b8'}}>Sem movimentações registadas.</div>;
  }

  return (
    <div className={styles.historyContainer}>
      <span className={styles.title}>Histórico de Movimentações</span>
      <ul className={styles.list}>
        {history.map((op) => (
          <li key={op.id} className={styles.item}>
            <div className={styles.info}>
              <span className={styles.typeBadge}>{op.type === 'IN' ? '📈' : '📉'}</span>
              <div>
                <span className={styles.quantity}>{op.quant} un</span>
                <span className={styles.customer}> • {op.customer || 'Sistema'}</span>
              </div>
            </div>
            <button 
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation(); // Impede que o clique feche a linha
                handleDelete(op.id);
              }}
              disabled={isDeleting}
            >
              {isDeleting ? '...' : 'Apagar'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}