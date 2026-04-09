'use client';

import { IReceiptItem } from '@/types';
import styles from './ReceiptTable.module.css';

interface ReceiptTableProps {
  items: IReceiptItem[];
}

export const ReceiptTable = ({ items }: ReceiptTableProps) => {
  return (
    <main className={styles.itemsSection}>
      <table className={styles.modernTable}>
        <thead>
          <tr>
            {/* O primeiro é à esquerda, os outros acompanham o dado à direita */}
            <th className={styles.textLeft}>ITEM</th>
            <th className={styles.textRight}>QTD/KG</th>
            <th className={styles.textRight}>Preço UNIT</th>
            <th className={styles.textRight}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const price = Number(item.ESTOQUE_product?.price ?? 0);
            const quant = Number(item.quant ?? 0);
            
            return (
              <tr key={idx}>
                <td className={styles.itemName}>
                  {item.ESTOQUE_product?.name || 'Produto não identificado'}
                </td>
                
                <td className={`${styles.textRight} ${styles.mono}`}>
                  {quant.toFixed(2)}
                </td>
                
                <td className={`${styles.textRight} ${styles.mono}`}>
                  <span className={styles.currencySymbol}>R$</span>
                  {price.toFixed(2)}
                </td>
                
                <td className={`${styles.textRight} ${styles.mono} ${styles.fontBold}`}>
                  <span className={styles.currencySymbol}>R$</span>
                  {(quant * price).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
};