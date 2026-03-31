'use client';

import styles from './FinancialSummary.module.css';

interface FinancialSummaryProps {
  subtotal: number;
  discountVal: number;
  totalFinal: number;
}

const FinancialSummary = ({ subtotal, discountVal, totalFinal }: FinancialSummaryProps) => {
  return (
    <div className={styles.summary}>
      <div className={styles.summaryLine}>
        <span>Subtotal:</span>
        <span>R$ {subtotal.toFixed(2)}</span>
      </div>
      
      <div className={styles.summaryLine}>
        <span>Desconto:</span>
        <span className={styles.discountText}>- R$ {discountVal.toFixed(2)}</span>
      </div>

      <div className={styles.totalValue}>
        <span>TOTAL</span>
        <span>R$ {totalFinal.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default FinancialSummary;