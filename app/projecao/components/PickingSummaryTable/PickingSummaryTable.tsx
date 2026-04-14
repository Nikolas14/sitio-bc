'use client';

import styles from './PickingSummaryTable.module.css';

interface PickingSummaryTableProps {
  consolidated: Array<{
    name: string;
    total: number;
  }>;
}

export default function PickingSummaryTable({ consolidated }: PickingSummaryTableProps) {
  return (
    <div className={styles.pickingCard}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Resumo de projeção de saída para o próximo envio</h2>
        <p className={styles.cardSubtitle}>Quantidades totais somadas por produto</p>
      </header>

      <table className={styles.pickingTable}>
        <thead>
          <tr>
            <th>PRODUTO</th>
            <th className={styles.textRight}>TOTAL NECESSÁRIO</th>
          </tr>
        </thead>
        <tbody>
          {consolidated.map((item, idx) => (
            <tr key={idx} className={styles.tableRow}>
              <td className={styles.prodName}>{item.name}</td>
              <td className={styles.prodTotal}>
                {item.total.toFixed(2)} <span className={styles.unit}>KG</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}