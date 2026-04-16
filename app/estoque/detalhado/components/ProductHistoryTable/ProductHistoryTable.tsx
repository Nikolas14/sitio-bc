'use client';

import { useMemo } from 'react';
import { IOperation } from '@/types';
import styles from './ProductHistoryTable.module.css';

interface ProductHistoryTableProps {
  history: IOperation[];
  loading: boolean;
}

const ProductHistoryTable = ({ history, loading }: ProductHistoryTableProps) => {
  
  // Calculamos o saldo progressivo usando useMemo para performance
  const historyWithBalance = useMemo(() => {
    // 1. Criamos uma cópia e ordenamos da mais antiga para a mais nova para calcular o saldo
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runningBalance = 0;

    // 2. Mapeamos calculando o saldo após cada linha
    const computed = sortedHistory.map((op) => {
      if (op.type === 'IN') {
        runningBalance += Number(op.quant);
      } else {
        runningBalance -= Number(op.quant);
      }
      return { ...op, balanceAfter: runningBalance };
    });

    // 3. Invertemos novamente para exibir a mais recente no topo da tabela
    return computed.reverse();
  }, [history]);

  if (loading) {
    return <div className={styles.loadingState}>Buscando movimentações...</div>;
  }

  if (history.length === 0) {
    return (
      <div className={styles.emptyHistory}>
        Nenhuma movimentação encontrada para este período.
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.historyTable}>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Qtd (KG)</th>
            <th>Saldo</th> {/* Nova Coluna */}
            <th>Origem / Cliente</th>
          </tr>
        </thead>
        <tbody>
          {historyWithBalance.map((h) => (
            <tr key={h.id}>
              <td className={styles.dateCell}>
                {new Date(h.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td>
                <span className={h.type === 'IN' ? styles.badgeIn : styles.badgeOut}>
                  {h.type === 'IN' ? '▲ ENTRADA' : '▼ SAÍDA'}
                </span>
              </td>
              <td className={styles.quantCell}>
                {h.type === 'IN' ? '+' : '-'}{Number(h.quant).toFixed(3)}
              </td>
              {/* Célula de Saldo com cor condicional */}
              <td className={`${styles.balanceCell} ${h.balanceAfter < 0 ? styles.negative : ''}`}>
                {h.balanceAfter.toFixed(3)} kg
              </td>
              <td className={styles.originCell}>
                <div className={styles.customerName}>
                  {h.ESTOQUE_transaction?.customer_vendor || 'Ajuste Interno'}
                </div>
                <span className={styles.serialRef}>
                  Ref: #{h.ESTOQUE_transaction?.serial_number || 'S/N'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductHistoryTable;