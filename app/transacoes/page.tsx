'use client';

import { useState, useMemo } from 'react';
import styles from './page.module.css';

// Hooks
import { useTransactions } from '@/hooks/useTransactions';
import { useTransactionItems } from '@/hooks/useTransactionItems';
import { useDeleteTransaction } from '@/hooks/useDeleteTransaction';

// Componentes
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import TransactionCard from './components/TransactionCard/TransactionCard';
import TransactionItemsTable from './components/TransactionItemsTable/TransactionItemsTable';
import TransactionFinanceSummary from './components/TransactionFinanceSummary/TransactionFinanceSummary';
import TransactionReceiptHeader from './components/TransactionReceiptHeader/TransactionReceiptHeader';
import DeleteTransactionModal from './components/DeleteTransactionModal/DeleteTransactionModal';

export default function TransacoesInterface() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hooks de Dados
  const { 
    transactions, loading, searchTerm, setSearchTerm, filterDate, setFilterDate, refresh 
  } = useTransactions();
  
  const { items, loading: itemsLoading } = useTransactionItems(selectedId);
  const { deleteTransaction } = useDeleteTransaction();

  // Encontra a transação ativa
  const active = useMemo(() =>
    transactions.find(t => t.id === selectedId),
    [transactions, selectedId]);

  // Cálculos financeiros (Subtotal, Desconto, Total)
  const financial = useMemo(() => {
    if (!active) return null;
    const subtotal = Number(active.total_price) || 0;
    const discountVal = subtotal * (Number(active.discount_percent || 0) / 100);
    const finalTotal = (subtotal - discountVal) + (Number(active.tax_amount) || 0) + (Number(active.shipping_cost) || 0);
    return { subtotal, discountVal, finalTotal };
  }, [active]);

  // Função para Deletar
  const handleConfirmDelete = async (password: string) => {
    const MINHA_SENHA_MESTRA = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

    if (password !== MINHA_SENHA_MESTRA) {
      alert("Senha de administrador incorreta!");
      return;
    }

    if (active) {
      setIsDeleting(true);
      const res = await deleteTransaction(active.id, items, active.type);
      
      if (res.success) {
        alert("Sucesso! Transação removida e estoque estornado.");
        setSelectedId(null);
        refresh(); // Atualiza a lista sem recarregar a página
      } else {
        alert("Erro técnico ao tentar deletar.");
      }
      
      setIsDeleting(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className={styles.screen}>
      {/* PAINEL LATERAL: LISTA DE TRANSAÇÕES */}
      <aside className={styles.leftPanel}>
        <div className={styles.filterHeader}>
          <HeaderInput 
            titulo="Histórico" 
            valor={searchTerm} 
            setValor={setSearchTerm} 
            labelDescricao='Pesquisar' 
            placeholder='Pesquisar cliente...' 
          />

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
            <p className={styles.statusMsg}>Buscando registros...</p>
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
            <p className={styles.statusMsg}>Nenhuma transação encontrada.</p>
          )}
        </div>
      </aside>

      {/* PAINEL PRINCIPAL: DETALHE DO RECIBO */}
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
              type={active.type} 
            />

            <TransactionFinanceSummary
              subtotal={financial.subtotal}
              discountPercent={active.discount_percent}
              discountValue={financial.discountVal}
              finalTotal={financial.finalTotal}
              type={active.type}
            />

            {/* BOTÃO DE DELEÇÃO NO FINAL DO RECIBO */}
            <div className={styles.dangerZone}>
              <button 
                className={styles.deleteBtn}
                onClick={() => setIsModalOpen(true)}
              >
                🗑️ Deletar Registro e Estornar Estoque
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>🔎</span>
            <p>Selecione uma transação para ver os detalhes</p>
          </div>
        )}
      </main>

      {/* MODAL DE SEGURANÇA */}
      <DeleteTransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}