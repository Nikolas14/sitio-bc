'use client';

import styles from './ReceiptSummary.module.css';

interface ReceiptSummaryProps {
  financial: {
    sub: number;
    discountValue: number;
    subWithDiscount: number;
    final: number;
    paid: number;
    remaining: number;
  };
  shipping: number;
  tax: number;
  discountPercent: number; // Recebemos a % para mostrar no texto
}

export const ReceiptSummary = ({ financial, shipping, tax, discountPercent }: ReceiptSummaryProps) => {
  return (
    <footer className={styles.footerSection}>
      <div className={styles.summaryWrapper}>
        <div className={styles.summaryBox}>
          
          {/* VALOR BRUTO */}
          <div className={styles.sRow}>
            <span>TOTAL BRUTO</span>
            <span className={styles.mono}>R$ {financial.sub.toFixed(2)}</span>
          </div>
          
          {/* DESCONTO (Só aparece se for maior que zero) */}
          {discountPercent > 0 && (
            <div className={`${styles.sRow} ${styles.discountLine}`}>
              <span>DESCONTO ({discountPercent}%)</span>
              <span className={styles.mono}>- R$ {financial.discountValue.toFixed(2)}</span>
            </div>
          )}

          <div className={styles.divider} />

          {/* CUSTOS ADICIONAIS */}
          {shipping > 0 && (
            <div className={styles.sRow}>
              <span>FRETE / LOGÍSTICA</span>
              <span className={styles.mono}>+ R$ {shipping.toFixed(2)}</span>
            </div>
          )}
          
          {tax > 0 && (
            <div className={styles.sRow}>
              <span>IMPOSTO</span>
              <span className={styles.mono}>+ R$ {tax.toFixed(2)}</span>
            </div>
          )}

          {/* TOTAL FINAL COM DESTAQUE */}
          <div className={styles.totalLine}>
            <span className={styles.totalLabel}>TOTAL LÍQUIDO</span>
            <span className={styles.totalValue}>R$ {financial.final.toFixed(2)}</span>
          </div>
        </div>

        {/* ÁREA DE PAGAMENTO */}
        {financial.paid > 0 && (
          <div className={styles.paymentStatus}>
            <div className={styles.sRow} style={{ color: '#166534' }}>
              <span>VALOR RECEBIDO</span>
              <span className={styles.mono}>R$ {financial.paid.toFixed(2)}</span>
            </div>
            {financial.remaining > 0 && (
              <div className={styles.debtRow}>
                <span>SALDO DEVEDOR</span>
                <span className={styles.mono}>R$ {financial.remaining.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </footer>
  );
};