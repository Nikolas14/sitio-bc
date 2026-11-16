'use client';

import { IOperation } from '@/types';
import styles from './ProductHistoryTable.module.css';

// Operação com o saldo do produto logo após ela (calculado na página, do mais novo ao mais antigo)
export type HistoryRow = IOperation & { balanceAfter: number };

interface ProductHistoryTableProps {
  rows: HistoryRow[];
  loading: boolean;
}

const ProductHistoryTable = ({ rows, loading }: ProductHistoryTableProps) => {
  if (loading) {
    return <div className={styles.loadingState}>Buscando movimentações...</div>;
  }

  if (rows.length === 0) {
    return (
      <div className={styles.emptyHistory}>
        Nenhuma movimentação encontrada neste intervalo.
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
            <th>Saldo</th>
            <th className={styles.originHeader}>Origem / Cliente</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
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
              <td className={`${styles.balanceCell} ${h.balanceAfter < 0 ? styles.negative : ''}`}>
                {h.balanceAfter.toFixed(3)} kg
              </td>
              <td className={styles.originCell}>
                <div className={styles.customerName} title={h.ESTOQUE_transaction?.customer_vendor || 'Ajuste Interno'}>
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