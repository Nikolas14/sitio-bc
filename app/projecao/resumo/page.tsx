'use client';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import SideFooter from '@/components/SideFooter/SideFooter';
import { usePickingSummary } from '@/hooks/usePickingSummary';
import styles from './page.module.css';

export default function ResumoProjecaoPage() {
  const { consolidated, totalGeral, loading, refresh } = usePickingSummary();

  if (loading) return <div className={styles.center}>Calculando Picking List...</div>;

  return (
    <div className={styles.screen}>
      
      {/* BARRA LATERAL: Estatísticas de Saída */}
      <aside className={styles.leftPanel}>
        <HeaderPadrao titulo="Resumo Geral" />
        
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>PESO TOTAL A SAIR</span>
            <div className={styles.statValue}>
              {totalGeral.toFixed(2)} <small>KG</small>
            </div>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>VARIEDADE DE ITENS</span>
            <div className={styles.statValue}>{consolidated.length}</div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrint} onClick={() => window.print()}>
            🖨️ Imprimir Separação
          </button>
          <SideFooter onRefresh={refresh} />
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL: Tabela Consolidada */}
      <main className={styles.contentWrapper}>
        <div className={styles.pickingCard}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Lista de Separação Consolidada</h2>
            <span className={styles.tag}>Status: Aguardando Carregamento</span>
          </header>

          <table className={styles.pickingTable}>
            <thead>
              <tr>
                <th>PRODUTO</th>
                <th className={styles.textRight}>TOTAL NECESSÁRIO</th>
                <th className={styles.textCenter}>CONFERIDO</th>
              </tr>
            </thead>
            <tbody>
              {consolidated.map((item, idx) => (
                <tr key={idx} className={styles.tableRow}>
                  <td className={styles.prodName}>{item.name}</td>
                  <td className={styles.prodTotal}>{item.total.toFixed(2)} KG</td>
                  <td className={styles.textCenter}>
                    <div className={styles.checkCircle}></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}