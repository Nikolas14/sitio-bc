'use client';

import styles from './PickingSidebarStats.module.css';

interface PickingSidebarStatsProps {
  totalKg: number;
  totalItems: number;
  onPrint: () => void;
}

export const PickingSidebarStats = ({ 
  totalKg, 
  totalItems, 
  onPrint 
}: PickingSidebarStatsProps) => {
  return (
    <div className={styles.statsContainer}>
      <div className={styles.headerArea}>
        <span className={styles.title}>Indicadores de Saída</span>
      </div>

      <div className={styles.statCard}>
        <span className={styles.statLabel}>PESO TOTAL A SAIR</span>
        <div className={styles.statValue}>
          {totalKg.toFixed(2)} <small className={styles.unit}>KG</small>
        </div>
      </div>

      {/* <div className={styles.statCardSecondary}>
        <span className={styles.statLabel}>VARIEDADE DE PRODUTOS</span>
        <div className={styles.statValueSmall}>{totalItems} itens</div>
      </div> */}

      <button className={styles.btnPrint} onClick={onPrint}>
        <span className={styles.icon}>🖨️</span> Imprimir Separação
      </button>
    </div>
  );
};