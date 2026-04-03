'use client';

import { useState, useMemo } from 'react';
import styles from './page.module.css';
import { useInventory } from '@/hooks/useInventory';
import { useHistory, Period } from '@/hooks/useHistory';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import ProductSidebarList from './components/ProductSidebarList/ProductSidebarList';
import HeaderMov from '@/components/HeaderMov/HeaderMov';

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
          <HeaderMov setValor={setSearchTerm} titulo='Estoque detalhado' valor={searchTerm} labelDescricao='Filtro de produtos' />
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
            <header className={styles.detailHeader}>
              <div className={styles.titleInfo}>
                <span className={styles.categoryTag}>
                  {selectedProduct.type || 'GERAL'}
                </span>
                <h2 className={styles.mainProductName}>{selectedProduct.name}</h2>
                <div className={styles.miniStats}>
                  <p className={styles.statIn}>Entradas: +{totals.in.toFixed(3)}kg</p>
                  <p className={styles.statOut}>Saídas: -{totals.out.toFixed(3)}kg</p>
                </div>
              </div>

              <div className={styles.stockSummary}>
                <button onClick={() => window.print()} className={styles.printExtractBtn}>
                  🖨️ IMPRIMIR EXTRATO
                </button>
                <div className={styles.largeStock}>
                  <p className={styles.labelLabel}>Saldo Disponível</p>
                  <p className={styles.stockValueNumber}>
                    {Number(selectedProduct.current_stock).toFixed(3)}
                    <span className={styles.unit}>KG</span>
                  </p>
                </div>
              </div>
            </header>

            <div className={styles.historyControls}>
              <h3 className={styles.sectionTitle}>HISTÓRICO DE MOVIMENTAÇÕES</h3>

              <div className={styles.periodToggle}>
                {(['yesterday', '3d', '7d', '30d', 'all'] as Period[]).map((p) => (
                  <button
                    key={p}
                    className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ''}`}
                    onClick={() => setPeriod(p)}
                  >
                    {p === 'yesterday' ? 'ONTEM' : p === '3d' ? '3D' : p === '7d' ? '7D' : p === '30d' ? '30D' : 'TUDO'}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className={styles.bigLoading}>BUSCANDO...</div>
            ) : (
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
                  {history.map(h => (
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
                        <span className={styles.serialRef}>Ref: #{h.ESTOQUE_transaction?.serial_number || 'S/N'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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