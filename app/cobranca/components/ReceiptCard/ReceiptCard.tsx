'use client';

import { forwardRef } from 'react';
import { IReceiptItem, ITransaction } from '@/types';
import styles from './ReceiptCard.module.css';
import { ReceiptHeader } from './components/ReceiptHeader/ReceiptHeader';
import { ReceiptBilling } from './components/ReceiptBilling/ReceiptBilling';
import { ReceiptTable } from './components/ReceiptTable/ReceiptTable';
import { ReceiptSummary } from './components/ReceiptSummary/ReceiptSummary';

interface ReceiptCardProps {
  trans: ITransaction | null;
  items: IReceiptItem[];
  shipping: number;
  tax: number;
  financial: any;
}

export const ReceiptCard = forwardRef<HTMLDivElement, ReceiptCardProps>(
  ({ trans, items, shipping, tax, financial }, ref) => {
    if (!trans) return null;

    const ITEMS_PER_PAGE = 18;
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
    const pages = Array.from({ length: totalPages }, (_, i) =>
      items.slice(i * ITEMS_PER_PAGE, i * ITEMS_PER_PAGE + ITEMS_PER_PAGE)
    );

    return (
      <div ref={ref} className={styles.captureContainer}>
        {pages.map((pageItems, index) => {
          const isFirstPage = index === 0;
          const isLastPage = index === totalPages - 1;

          return (
            <div key={index} className={styles.receiptPaper}>
              {/* Selo de Pago */}
              {isLastPage && trans.status === 'CONCLUIDO' && (
                <div className={styles.modernPaidBadge}>
                  <div className={styles.badgeCircle}>✓</div>
                  <span>PAGAMENTO CONFIRMADO</span>
                </div>
              )}

              <ReceiptHeader
                trans={trans}
                currentPage={index + 1}
                totalPages={totalPages}
              />

              {/* Faturamento */}
              {isFirstPage && (
                <ReceiptBilling
                  trans={trans}
                  currentPage={index + 1}
                  totalPages={totalPages}
                />
              )}


              {/* Tabela */}
              <main className={styles.itemsSection}>
                <ReceiptTable items={pageItems} />
              </main>

              {/* Rodapé/Resumo */}
              {isLastPage ? (
                <ReceiptSummary
                  financial={financial}
                  shipping={shipping}
                  tax={tax}
                  discountPercent={trans.discount_percent}
                />) : (
                <div className={styles.continueNote}>Continua na próxima página...</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

ReceiptCard.displayName = 'ReceiptCard';