'use client';

import styles from './HistoryControls.module.css';
import { DateRange } from '@/hooks/useHistory';

interface HistoryControlsProps {
  range: DateRange;
  setRange: (range: DateRange) => void;
}

const HistoryControls = ({ range, setRange }: HistoryControlsProps) => {
  return (
    <div className={styles.historyControls}>
      <h3 className={styles.sectionTitle}>HISTÓRICO DE MOVIMENTAÇÕES</h3>

      <div className={styles.dateRange}>
        <label className={styles.dateField}>
          <span className={styles.dateLabel}>De</span>
          <input
            type="date"
            className={styles.dateInput}
            value={range.from}
            max={range.to || undefined}
            onChange={(e) => setRange({ ...range, from: e.target.value })}
          />
        </label>

        <label className={styles.dateField}>
          <span className={styles.dateLabel}>Até</span>
          <input
            type="date"
            className={styles.dateInput}
            value={range.to}
            min={range.from || undefined}
            onChange={(e) => setRange({ ...range, to: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
};

export default HistoryControls;
