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

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type SortKey = keyof ITransaction | 'net_total';

// Mesma fórmula do resumo da cobrança: (bruto - desconto) + frete + imposto.
const getNetTotal = (t: ITransaction) => {
  const gross = Number(t.total_price || 0);
  return gross - gross * ((t.discount_percent || 0) / 100) + (t.shipping_cost ?? 0) + (t.tax_amount ?? 0);
};

type SortConfig = {
  key: SortKey;
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
        const aValue = sortConfig.key === 'net_total' ? getNetTotal(a) : a[sortConfig.key];
        const bValue = sortConfig.key === 'net_total' ? getNetTotal(b) : b[sortConfig.key];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

        const cmp = typeof aValue === 'number' && typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue), 'pt-BR', { numeric: true });

        return sortConfig.direction === 'asc' ? cmp : -cmp;
      });
    }
    return sortableItems;
  }, [transactions, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageData = sortedData.slice(pageStart, pageStart + pageSize);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setPage(1);
  };

  // Função auxiliar para renderizar o ícone de ordenação
  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const sortableTh = (key: SortKey, label: string) => (
    <th
      className={styles.sortableHeader}
      onClick={() => requestSort(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          requestSort(key);
        }
      }}
      tabIndex={0}
      aria-sort={sortConfig?.key === key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label} <span className={sortConfig?.key === key ? styles.sortActive : styles.sortIdle}>{getSortIcon(key)}</span>
    </th>
  );

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {sortableTh('serial_number', 'Série')}
              {sortableTh('customer_vendor', 'Cliente')}
              {sortableTh('created_at', 'Data')}
              {sortableTh('net_total', 'Total Líquido')}
              <th>Status</th>
              <th className="text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.loading}>Carregando transações...</td></tr>
            ) : (
              pageData.map(t => (
                <tr
                  key={t.id}
                  className={styles.tableRow}
                  onClick={() => router.push(`/cobranca/${t.id}`)}
                >
                  <td className={styles.serial}>#{t.serial_number}</td>
                  <td className={styles.customer}>{t.customer_vendor}</td>
                  <td className={styles.date}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className={`${styles.price} ${styles.netPrice}`}>{brl.format(getNetTotal(t))}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles['status' + (t.status || 'PENDENTE')]}`}>
                      {t.status || 'PENDENTE'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/cobranca/${t.id}`);
                      }}
                    >
                      Gerenciar
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