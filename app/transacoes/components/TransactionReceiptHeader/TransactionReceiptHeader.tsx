'use client';

import styles from './TransactionReceiptHeader.module.css';

interface ReceiptHeaderProps {
  customerVendor: string;
  serialNumber: string;
  createdAt: string;
  totalKg: number | string;
}

const TransactionReceiptHeader = ({ 
  customerVendor, 
  serialNumber, 
  createdAt, 
  totalKg 
}: ReceiptHeaderProps) => {
  return (
    <header className={styles.receiptHeader}>
      <div className={styles.titleInfo}>
        <p className={styles.upperLabel}>Detalhe da Transação</p>
        <h2 className={styles.mainTitle}>{customerVendor}</h2>
        <p className={styles.subLabel}>
          <strong>#{serialNumber}</strong> • {new Date(createdAt).toLocaleString('pt-BR')}
        </p>
      </div>

      <div className={styles.weightBox}>
        <p className={styles.upperLabel}>Peso Total</p>
        <p className={styles.weightValue}>
          {Number(totalKg).toFixed(3)} <span>KG</span>
        </p>
      </div>
    </header>
  );
};

export default TransactionReceiptHeader;