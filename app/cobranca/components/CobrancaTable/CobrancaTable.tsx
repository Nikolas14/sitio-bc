'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CobrancaTable.module.css';

interface CobrancaTableProps {
  transactions: any[];
  loading: boolean;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export default function CobrancaTable({ transactions, loading }: CobrancaTableProps) {
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });

  // Lógica de Ordenação
  const sortedData = useMemo(() => {
    const sortableItems = [...transactions];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [transactions, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função auxiliar para renderizar o ícone de ordenação
  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '🔼' : '🔽';
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th onClick={() => requestSort('serial_number')} className={styles.sortableHeader}>
              Série {getSortIcon('serial_number')}
            </th>
            <th onClick={() => requestSort('customer_vendor')} className={styles.sortableHeader}>
              Cliente {getSortIcon('customer_vendor')}
            </th>
            <th onClick={() => requestSort('created_at')} className={styles.sortableHeader}>
              Data {getSortIcon('created_at')}
            </th>
            <th onClick={() => requestSort('total_price')} className={styles.sortableHeader}>
              Total Bruto {getSortIcon('total_price')}
            </th>
            <th>Status</th>
            <th className="text-right">Ação</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className={styles.loading}>Carregando transações...</td></tr>
          ) : (
            sortedData.map(t => (
              <tr key={t.id} className={styles.tableRow}>
                <td className={styles.serial}>#{t.serial_number}</td>
                <td className={styles.customer}>{t.customer_vendor}</td>
                <td className={styles.date}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                <td className={styles.price}>R$ {Number(t.total_price || 0).toFixed(2)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles['status' + (t.status || 'PENDENTE')]}`}>
                    {t.status || 'PENDENTE'}
                  </span>
                </td>
                <td className="text-right">
                  <button
                    className={styles.actionBtn}
                    onClick={() => router.push(`/cobranca/${t.id}`)}
                  >
                    ⚙️ Gerenciar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {!loading && sortedData.length === 0 && (
        <div className={styles.empty}>Nenhuma cobrança encontrada.</div>
      )}
    </div>
  );
}