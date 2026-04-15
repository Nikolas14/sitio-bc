'use client';

import { IReceiptItem } from '@/types';
import styles from './ReceiptTable.module.css';

interface ReceiptTableProps {
  items: IReceiptItem[];
}

export const ReceiptTable = ({ items }: ReceiptTableProps) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(val);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.modernTable}>
        <thead>
          <tr>
            <th className={styles.textLeft}>PRODUTO / ITEM</th>
            <th className={styles.textRight}>QTD / KG</th>
            <th className={styles.textRight}>UNITÁRIO</th>
            <th className={styles.textRight}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const price = Number(item.ESTOQUE_product?.price ?? 0);
            const quant = Number(item.quant ?? 0);
            const total = quant * price;
            
            return (
              <tr key={idx} className={styles.row}>
                <td className={styles.itemName}>
                  {item.ESTOQUE_product?.name || 'Produto não identificado'}
                </td>
                
                <td className={`${styles.textRight} ${styles.mono}`}>
                  {quant.toFixed(2)}
                </td>
                
                <td className={`${styles.textRight} ${styles.mono}`}>
                  <span className={styles.currency}>R$</span> {formatCurrency(price)}
                </td>
                
                <td className={`${styles.textRight} ${styles.mono} ${styles.fontBold}`}>
                  <span className={styles.currency}>R$</span> {formatCurrency(total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className={styles.emptyState}>
          Nenhum item registrado nesta transação.
        </div>
      )}
    </div>
  );
};