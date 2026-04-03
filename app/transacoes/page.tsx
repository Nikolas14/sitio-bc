'use client';

import { useState, useMemo } from 'react';
import styles from './page.module.css';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransactionItems } from '@/hooks/useTransactionItems';
import TransactionCard from './components/TransactionCard/TransactionCard';
import TransactionItemsTable from './components/TransactionItemsTable/TransactionItemsTable';
import TransactionFinanceSummary from './components/TransactionFinanceSummary/TransactionFinanceSummary';
import TransactionReceiptHeader from './components/TransactionReceiptHeader/TransactionReceiptHeader';
export default function TransacoesInterface() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Hooks Personalizados
  const { transactions, loading, searchTerm, setSearchTerm, filterDate, setFilterDate } = useTransactions();

  const { items, loading: itemsLoading } = useTransactionItems(selectedId);

  // Encontra a transação ativa para o cabeçalho do recibo
  const active = useMemo(() =>
    transactions.find(t => t.id === selectedId),
    [transactions, selectedId]);

  // Cálculos financeiros baseados na transação ativa
  const financial = useMemo(() => {
    if (!active) return null;
    const subtotal = Number(active.total_price);
    const discountVal = subtotal * (Number(active.discount_percent) / 100);
    const finalTotal = (subtotal - discountVal) + (Number(active.tax_amount) || 0) + (Number(active.shipping_cost) || 0);
    return { subtotal, discountVal, finalTotal };
  }, [active]);

  return (
    <div className={styles.screen}>
      <aside className={styles.leftPanel}>
        <div className={styles.filterHeader}>
          <HeaderInput titulo="Histórico transações" valor={searchTerm} setValor={(e) => setSearchTerm(e)} labelDescricao='Pesquisar' placeholder='Pesquisar cliente...' />

          <div className={styles.searchBox}>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>

        <div className={styles.scrollArea}>
          {loading ? (
            <p className={styles.statusMsg}>Carregando transações...</p>
          ) : (
            transactions.map(t => (
              <TransactionCard
                key={t.id}
                transaction={t}
                isSelected={selectedId === t.id}
                onClick={setSelectedId}
              />
            ))
          )}

          {!loading && transactions.length === 0 && (
            <div className={styles.emptyContainer}>
              <p className={styles.statusMsg}>Nenhuma transação encontrada.</p>
            </div>
          )}
          
        </div>
      </aside>

      <main className={styles.rightPanel}>
        {active && financial ? (
          <div className={styles.receipt}>

            <TransactionReceiptHeader
              customerVendor={active.customer_vendor}
              serialNumber={active.serial_number}
              createdAt={active.created_at}
              totalKg={active.total_kg}
            />

            <TransactionItemsTable 
              items={items} 
              loading={itemsLoading} 
              type={active?.type} 
            />

            <TransactionFinanceSummary
              subtotal={financial.subtotal}
              discountPercent={active.discount_percent}
              discountValue={financial.discountVal}
              finalTotal={financial.finalTotal}
              type={active.type}
            />

          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>🔎</span>
            <p>Selecione uma transação para ver os detalhes</p>
          </div>
        )}
      </main>
    </div>
  );
}