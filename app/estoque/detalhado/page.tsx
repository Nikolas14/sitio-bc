'use client';

import styles from './page.module.css';

import { useState, useMemo } from 'react';

import { useInventory } from '@/hooks/useInventory';
import { useHistory, getRangeWindow, toInputDate, DateRange } from '@/hooks/useHistory';

import ProductSidebarList from './components/ProductSidebarList/ProductSidebarList';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import ProductHistoryTable, { HistoryRow } from './components/ProductHistoryTable/ProductHistoryTable';
import HistoryControls from './components/HistoryControls/HistoryControls';
import ProductDetailHeader from './components/ProductDetailHeader/ProductDetailHeader';
import SideFooter from '@/components/SideFooter/SideFooter';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';

export default function DetalhesPage() {
  const { products, loading: productsLoading ,refresh} = useInventory();

  // Estados de controle da UI
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Intervalo de datas do histórico (padrão: últimos 30 dias)
  const [range, setRange] = useState<DateRange>(() => {
    const today = new Date();
    const past = new Date();
    past.setDate(past.getDate() - 30);
    return { from: toInputDate(past), to: toInputDate(today) };
  });

  // Hook personalizado que criamos para buscar as movimentações
  const { history, loading: historyLoading } = useHistory(selectedId, range);

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

  // Saldo após cada movimento: parte do estoque atual e volta no tempo
  // (o histórico sempre vai até agora, então o mais novo fecha no saldo atual)
  const ledger = useMemo<HistoryRow[]>(() => {
    const newestFirst = [...history].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.id - a.id
    );

    const rows: HistoryRow[] = [];
    let balance = Number(selectedProduct?.current_stock) || 0;

    for (const op of newestFirst) {
      rows.push({ ...op, balanceAfter: balance });
      const delta = Number(op.quant) || 0;
      // saldo antes desta operação = saldo depois menos o efeito dela
      balance = op.type === 'IN' ? balance - delta : balance + delta;
    }

    return rows;
  }, [history, selectedProduct]);

  // Movimentos dentro do intervalo escolhido (o "até" entra inteiro)
  const visibleRows = useMemo(() => {
    const { start, end } = getRangeWindow(range);
    return ledger.filter((row) => {
      const date = new Date(row.created_at);
      return (!start || date >= start) && (!end || date < end);
    });
  }, [ledger, range]);

  // Cálculo de totais do intervalo selecionado
  const totals = useMemo(() => {
    return visibleRows.reduce((acc, curr) => {
      const q = Number(curr.quant) || 0;
      if (curr.type === 'IN') acc.in += q;
      else acc.out += q;
      return acc;
    }, { in: 0, out: 0 });
  }, [visibleRows]);

  return (
    <PageLayout>
      {/* PAINEL LATERAL: LISTA DE PRODUTOS */}
      <Sidebar>
        <div className={styles.searchHeader}>
          <HeaderInput setValor={setSearchTerm} titulo='Estoque detalhado' valor={searchTerm} labelDescricao='Filtro de produtos' />
        </div>

        <ProductSidebarList
          products={filteredList}
          loading={productsLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <SideFooter onRefresh={refresh} refreshLabel="Sincronizar Dados">
          {/* O que for colocado aqui dentro aparece acima do botão */}
        </SideFooter>

      </Sidebar>

      {/* PAINEL PRINCIPAL: DETALHES E HISTÓRICO */}
      <Main>
        {selectedProduct ? (
          <div className={styles.detailCard}>
            <ProductDetailHeader
              name={selectedProduct.name}
              type={selectedProduct.type}
              currentStock={selectedProduct.current_stock}
              totalIn={totals.in}
              totalOut={totals.out}
            />

            <HistoryControls range={range} setRange={setRange} />

            <ProductHistoryTable rows={visibleRows} loading={historyLoading} />

          </div>
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🔎</span>
            <p className={styles.emptyText}>Selecione um produto na lista lateral</p>
          </div>
        )}
      </Main>
    </PageLayout>
  );
}