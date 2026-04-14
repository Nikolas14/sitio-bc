'use client';

import styles from './AvailabilityTable.module.css';

export default function AvailabilityTable({ data }: { data: any[] }) {
  return (
    <div className={styles.grid}>
      {data.map((item) => {
        const isNegative = item.saldo_previsto < 0;
        const isWarning = item.saldo_previsto === 0 && item.total_projetado > 0;

        // Definindo qual classe de status aplicar ao card todo
        const statusClass = isNegative 
          ? styles.cardDanger 
          : isWarning 
            ? styles.cardWarning 
            : styles.cardOk;

        return (
          <div key={item.product_id} className={`${styles.card} ${statusClass}`}>
            <div className={styles.cardName} title={item.product_name}>
              {item.product_name}
            </div>

            <div className={styles.cardStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Físico</span>
                <strong className={styles.statValue}>{item.estoque_real.toFixed(1)}</strong>
              </div>
              <div className={`${styles.statItem} ${styles.right}`}>
                <span className={styles.statLabel}>Proj.</span>
                <strong className={styles.statValue}>{item.total_projetado.toFixed(1)}</strong>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <span className={styles.footerLabel}>Saldo:</span>
              <span className={`${styles.balanceValue} ${isNegative ? styles.balanceNegative : ''}`}>
                {item.saldo_previsto.toFixed(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}