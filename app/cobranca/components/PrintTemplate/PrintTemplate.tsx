'use client';
import React, { forwardRef } from 'react';
import styles from './PrintTemplate.module.css';
import { ITransaction } from '@/types';

type Props = {
  trans: ITransaction;
  items: any[];
  financial: {
    sub: number;
    discountValue: number;
    final: number;
    paid: number;
    remaining: number;
  };
  shipping: number;
  tax: number;
};

export const PrintTemplate = forwardRef<HTMLDivElement, any>(({ trans, items, financial, shipping, tax }, ref) => {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  return (
    <div className={styles.printWrapper}>
      {/* O REF vai aqui para capturar apenas o que importa */}
      <div ref={ref} className={styles.printContainer}>
        <div className={styles.header}>
          <h1 className={styles.companyName}>Beit Chabad Belém</h1>
          <p className={styles.subtitle}>Nota de Envio / Cobrança</p>
        </div>

        <div className={styles.infoGrid}>
          <div>
            <p><strong>Cliente:</strong> {trans.customer_vendor}</p>
            <p><strong>Data:</strong> {new Date(trans.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className={styles.textRight}>
            <p><strong>Ref:</strong> {trans.serial_number || trans.id.slice(0,8).toUpperCase()}</p>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produto</th>
              <th className={styles.textCenter}>Qtd</th>
              <th className={styles.textRight}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i: number) => (
              <tr key={i}>
                <td>{item.ESTOQUE_product?.name}</td>
                <td className={styles.textCenter}>{item.quant}</td>
                <td className={styles.textRight}>
                    {formatCurrency(item.quant * (item.ESTOQUE_product?.price || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.summarySection}>
          <div className={styles.summaryRow}>
            <span>Subtotal:</span>
            <span>{formatCurrency(financial.sub)}</span>
          </div>
          {shipping > 0 && (
            <div className={styles.summaryRow}>
              <span>Frete:</span>
              <span>{formatCurrency(shipping)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className={styles.summaryRow}>
              <span>Taxas:</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}
          <div className={styles.totalRow}>
            <span>TOTAL:</span>
            <span>{formatCurrency(financial.final)}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.pixBox}>
            <p><strong>PAGAMENTO VIA PIX</strong></p>
            <p className={styles.pixKey}>CNPJ: 02.256.458/0001-31</p>
          </div>
          <p className={styles.thankYou}>Obrigado pela sua confiança!</p>
        </div>
      </div>
    </div>
  );
});

PrintTemplate.displayName = 'PrintTemplate';