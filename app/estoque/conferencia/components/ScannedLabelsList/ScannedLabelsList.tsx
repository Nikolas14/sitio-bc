'use client';

import styles from './ScannedLabelsList.module.css';

export interface IScannedLabel {
  tempId: number;
  barcode: string;
  productId: number;
  name: string;
  weightKg: number;
}

interface ScannedLabelsListProps {
  labels: IScannedLabel[];
  onRemove: (tempId: number) => void;
}

export default function ScannedLabelsList({ labels, onRemove }: ScannedLabelsListProps) {
  if (labels.length === 0) {
    return <div className={styles.empty}>Nenhuma etiqueta bipada ainda.</div>;
  }

  const counts = labels.reduce<Record<string, number>>((acc, l) => {
    acc[l.barcode] = (acc[l.barcode] || 0) + 1;
    return acc;
  }, {});

  return (
    <ul className={styles.list}>
      {labels.map((l) => (
        <li key={l.tempId} className={`${styles.row} ${counts[l.barcode] > 1 ? styles.duplicate : ''}`}>
          <div className={styles.info}>
            <span className={styles.meta}>
              ID {l.productId} · {l.barcode}
              {counts[l.barcode] > 1 && <strong className={styles.dupTag}>repetida</strong>}
            </span>
            <span className={styles.name}>{l.name}</span>
          </div>
          <span className={styles.weight}>{l.weightKg.toFixed(3)} KG</span>
          <button className={styles.removeBtn} onClick={() => onRemove(l.tempId)} title="Remover etiqueta">
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
