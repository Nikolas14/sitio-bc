'use client';

import styles from './ReceiptHeader.module.css'; // O import deve bater com o objeto
import { ITransaction } from '@/types';

interface ReceiptHeaderProps {
  trans: ITransaction;
  currentPage?: number;
  totalPages?: number;
}

export const ReceiptHeader = ({ trans, currentPage, totalPages }: ReceiptHeaderProps) => {
  return (
    <header className={styles.invoiceHeader}>
      <div className={styles.companyBranding}>
        <div className={styles.logoPlaceholder}>B</div>
        <div>
          <h1 className={styles.brandTitle}>Beit Stock</h1>
          <p className={styles.brandSub}>SISTEMAS DE GESTÃO</p>
          {currentPage && (
            <span className={styles.pageIndicator}>
              PÁGINA {currentPage} / {totalPages}
            </span>
          )}
        </div>
      </div>

      <div className={styles.invoiceMeta}>
        <div className={styles.metaBox}>
          <span className={styles.metaLabel}>NÚMERO DA SÉRIE</span>
          <span className={styles.metaValue}>#{trans.serial_number}</span>
        </div>
        <div className={styles.metaBox}>
          <span className={styles.metaLabel}>DATA DE EMISSÃO</span>
          <span className={styles.metaValue}>
            {new Date(trans.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    </header>
  );
};