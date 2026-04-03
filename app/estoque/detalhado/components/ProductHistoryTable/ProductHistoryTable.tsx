'use client';

import { IOperation } from '@/types';
import styles from './ProductHistoryTable.module.css';

interface ProductHistoryTableProps {
  history: IOperation[];
  loading: boolean;
}

const ProductHistoryTable = ({ history, loading }: ProductHistoryTableProps) => {
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
    <table className={styles.historyTable}>
      <thead>
        <tr>
          <th>Data</th>
          <th>Tipo</th>
          <th>Qtd (KG)</th>
          <th>Origem / Cliente</th>
        </tr>
      </thead>
      <tbody>
        {history.map((h) => (
          <tr key={h.id}>
            <td className={styles.dateCell}>
              {new Date(h.created_at).toLocaleDateString()}
            </td>
            <td>
              <span className={h.type === 'IN' ? styles.badgeIn : styles.badgeOut}>
                {h.type === 'IN' ? '▲ ENTRADA' : '▼ SAÍDA'}
              </span>
            </td>
            <td className={styles.quantCell}>{Number(h.quant).toFixed(3)}</td>
            <td className={styles.originCell}>
              {h.ESTOQUE_transaction?.customer_vendor || 'Ajuste Interno'}
              <span className={styles.serialRef}>
                Ref: #{h.ESTOQUE_transaction?.serial_number || 'S/N'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ProductHistoryTable;