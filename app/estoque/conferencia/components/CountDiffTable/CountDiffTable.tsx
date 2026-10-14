'use client';

import { IAdjustmentLine } from '@/utils/stockCount';
import styles from './CountDiffTable.module.css';

interface CountDiffTableProps {
  lines: IAdjustmentLine[];
  onlyDivergent: boolean;
}

export default function CountDiffTable({ lines, onlyDivergent }: CountDiffTableProps) {
  const visible = lines
    .filter((l) => (onlyDivergent ? l.diffKg !== 0 : l.systemKg !== 0 || l.countedKg !== 0))
    .sort((a, b) => Math.abs(b.diffKg) - Math.abs(a.diffKg) || a.name.localeCompare(b.name));

  if (visible.length === 0) {
    return (
      <div className={styles.empty}>
        {onlyDivergent ? 'Nenhuma divergência — estoque bate com a conferência.' : 'Nenhum produto com saldo ou contagem.'}
      </div>
    );
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>ID</th>
          <th>Produto</th>
          <th className={styles.num}>Sistema</th>
          <th className={styles.num}>Contado</th>
          <th className={styles.num}>Diferença</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {visible.map((l) => (
          <tr key={l.productId}>
            <td className={styles.id}>{l.productId}</td>
            <td>
              <span className={styles.name}>{l.name}</span>
              {l.type && <span className={styles.category}>{l.type}</span>}
            </td>
            <td className={styles.num}>{l.systemKg.toFixed(2)}</td>
            <td className={styles.num}>{l.countedKg.toFixed(2)}</td>
            <td className={`${styles.num} ${l.diffKg > 0 ? styles.plus : l.diffKg < 0 ? styles.minus : ''}`}>
              {l.diffKg > 0 ? '+' : ''}{l.diffKg.toFixed(3)}
            </td>
            <td>
              {l.diffKg > 0 && <span className={`${styles.badge} ${styles.badgeIn}`}>▲ Entrada</span>}
              {l.diffKg < 0 && <span className={`${styles.badge} ${styles.badgeOut}`}>▼ Saída</span>}
              {l.diffKg === 0 && <span className={`${styles.badge} ${styles.badgeOk}`}>OK</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
