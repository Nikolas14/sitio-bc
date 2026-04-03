'use client';

import { useState, useMemo } from 'react';
import styles from './page.module.css';
import { useInventory } from '@/hooks/useInventory';
import { useHistory, Period } from '@/hooks/useHistory';
import ProductSidebarList from './components/ProductSidebarList/ProductSidebarList';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import ProductHistoryTable from './components/ProductHistoryTable/ProductHistoryTable';
import HistoryControls from './components/HistoryControls/HistoryControls';
import ProductDetailHeader from './components/ProductDetailHeader/ProductDetailHeader';

export default function DetalhesPage() {
  const { products, loading: productsLoading } = useInventory();

  // Estados de controle da UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>('30d');

  // Hook personalizado que criamos para buscar as movimentações
  const { history, loading: historyLoading } = useHistory(selectedId, period);

  // Filtro da lista lateral por nome
  const filteredList = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  // Captura os dados do produto selecionado na lista global
  const selectedProduct = useMemo(() =>
    products.find(p => p.id === selectedId),
    [products, selectedId]);

  // Cálculo de totais do período selecionado
  const totals = useMemo(() => {
    return history.reduce((acc, curr) => {
      const q = Number(curr.quant) || 0;
      if (curr.type === 'IN') acc.in += q;
      else acc.out += q;
      return acc;
    }, { in: 0, out: 0 });
  }, [history]);

  return (
    <div className={styles.screen}>
      {/* PAINEL LATERAL: LISTA DE PRODUTOS */}
      <aside className={styles.leftPanel}>
        <div className={styles.searchHeader}>
          <HeaderInput setValor={setSearchTerm} titulo='Estoque detalhado' valor={searchTerm} labelDescricao='Filtro de produtos' />
        </div>

        <ProductSidebarList
          products={filteredList}
          loading={productsLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

      </aside>

      {/* PAINEL PRINCIPAL: DETALHES E HISTÓRICO */}
      <main className={styles.rightPanel}>
        {selectedProduct ? (
          <div className={styles.detailCard}>
            <ProductDetailHeader
              name={selectedProduct.name}
              type={selectedProduct.type}
              currentStock={selectedProduct.current_stock}
              totalIn={totals.in}
              totalOut={totals.out}
            />

            <HistoryControls period={period} setPeriod={setPeriod} />

            <ProductHistoryTable history={history} loading={historyLoading} />

          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔎</span>
            <p className={styles.emptyText}>Selecione um produto na lista lateral</p>
          </div>
        )}
      </main>
    </div>
  );
}