'use client';

import React from 'react';
import styles from './TransactionFinanceSummary.module.css';

interface FinanceProps {
  subtotal: number;
  discountPercent: number;
  discountValue: number;
  finalTotal: number;
  type: 'IN' | 'OUT';
}

const TransactionFinanceSummary = ({ 
  subtotal, 
  discountPercent, 
  discountValue, 
  finalTotal, 
  type 
}: FinanceProps) => {
  
  // Regra de ouro: Se for entrada, não mostra financeiro
  if (type === 'IN') return null;

  return (
    <div className={styles.financeFooter}>
      <div className={styles.financeSummary}>
        
        <div className={styles.financeLine}>
          <span>Subtotal</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        
        {discountPercent > 0 && (
          <div className={styles.financeLine}>
            <span>Desconto ({discountPercent}%)</span>
            <span className={styles.discountText}>- R$ {discountValue.toFixed(2)}</span>
          </div>
        )}

        <div className={styles.totalLine}>
          <span>TOTAL FINAL</span>
          <span>R$ {finalTotal.toFixed(2)}</span>
        </div>

      </div>
    </div>
  );
};

export default TransactionFinanceSummary;