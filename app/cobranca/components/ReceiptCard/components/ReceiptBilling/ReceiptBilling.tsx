'use client';

import styles from './ReceiptBilling.module.css';
import { ITransaction } from '@/types';

interface ReceiptBillingProps {
  trans: ITransaction;
  currentPage: number;
  totalPages: number;
}

export const ReceiptBilling = ({ trans, currentPage, totalPages }: ReceiptBillingProps) => {
  return (
    <section className={styles.billingSection}>
      <div className={styles.billTo}>
        <span className={styles.sectionLabel}>ENVIO PARA:</span>
        <h2 className={styles.customerTitle}>{trans.customer_vendor}</h2>
        <p className={styles.customerSub}>Relatório detalhado de venda.</p>
      </div>
      
      <div className={styles.pageInfo}>
        <span className={styles.sectionLabel}>CUPOM</span>
        <p className={styles.metaValue}>PÁGINA {currentPage} DE {totalPages}</p>
      </div>
    </section>
  );
};