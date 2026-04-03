'use client';

import styles from './HistoryControls.module.css';
import { Period } from '@/hooks/useHistory';

interface HistoryControlsProps {
  period: Period;
  setPeriod: (period: Period) => void;
}

const HistoryControls = ({ period, setPeriod }: HistoryControlsProps) => {
  const periods: { value: Period; label: string }[] = [
    { value: 'yesterday', label: 'ONTEM' },
    { value: '3d', label: '3D' },
    { value: '7d', label: '7D' },
    { value: '15d', label: '15D' },
    { value: '30d', label: '30D' },
    { value: 'all', label: 'TUDO' },
  ];

  return (
    <div className={styles.historyControls}>
      <h3 className={styles.sectionTitle}>HISTÓRICO DE MOVIMENTAÇÕES</h3>

      <div className={styles.periodToggle}>
        {periods.map((p) => (
          <button
            key={p.value}
            className={`${styles.periodBtn} ${
              period === p.value ? styles.periodBtnActive : ''
            }`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HistoryControls;