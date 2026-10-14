'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CobrancaTable.module.css';
import { ITransaction } from '@/types';

interface CobrancaTableProps {
  transactions: ITransaction[];
  loading: boolean;
}

const PAGE_SIZES = [25, 50, 100];

type SortConfig = {
  key: keyof ITransaction;
  direction: 'asc' | 'desc';
} | null;

export default function CobrancaTable({ transactions, loading }: CobrancaTableProps) {
  const router = useRouter();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [prevTransactions, setPrevTransactions] = useState(transactions);

  // Filtro/busca mudou a lista: volta para a primeira página.
  if (transactions !== prevTransactions) {
    setPrevTransactions(transactions);
    setPage(1);
  }

  // Lógica de Ordenação
  const sortedData = useMemo(() => {
    const sortableItems = [...transactions];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

        const aStr = String(aValue);
        const bStr = String(bValue);

        if (aStr < bStr) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [transactions, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageData = sortedData.slice(pageStart, pageStart + pageSize);

  const requestSort = (key: keyof ITransaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setPage(1);
  };

  // Função auxiliar para renderizar o ícone de ordenação
  const getSortIcon = (key: keyof ITransaction) => {
    if (sortConfig?.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '🔼' : '🔽';
  };

  return (
    <div className={styles.container}>
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
              pageData.map(t => (
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

      {!loading && sortedData.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            {pageStart + 1}–{Math.min(pageStart + pageSize, sortedData.length)} de {sortedData.length}
          </span>

          <div className={styles.pageControls}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹ Anterior
            </button>
            <span className={styles.pageInfo}>Página {currentPage} de {totalPages}</span>
            <button
              className={styles.pageBtn}
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima ›
            </button>
          </div>

          <select
            className={styles.pageSize}
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {PAGE_SIZES.map(size => <option key={size} value={size}>{size} por página</option>)}
          </select>
        </div>
      )}
    </div>
  );
}