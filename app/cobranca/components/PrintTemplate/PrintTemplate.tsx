'use client';
import React, { forwardRef } from 'react';
import styles from './PrintTemplate.module.css';
import { ITransaction, IReceiptItem } from '@/types';

type Props = {
  trans: ITransaction;
  items: IReceiptItem[];
  financial: {
    sub: number;
    discountValue: number;
    final: number;
    paid: number;
    remaining: number;
  };
  shipping: number;
  tax: number;
  discount: number;
};

export const PrintTemplate = forwardRef<HTMLDivElement, Props>(({ trans, items, financial, shipping, tax, discount }, ref) => {
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  // Itens do mesmo produto viram uma linha só: soma quantidades e totais.
  const linhas = Object.values(
    items.reduce<Record<string, { id: number | null; name: string; quant: number; total: number }>>((acc, item) => {
      const key = String(item.product_id ?? item.ESTOQUE_product?.name ?? '');
      const quant = Number(item.quant);
      const price = Number(item.unit_price ?? item.ESTOQUE_product?.price ?? 0);
      const linha = acc[key] ?? { id: item.product_id ?? null, name: item.ESTOQUE_product?.name ?? '', quant: 0, total: 0 };
      linha.quant += quant;
      linha.total += quant * price;
      acc[key] = linha;
      return acc;
    }, {})
  );

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
            <p><strong>Cliente:</strong></p>
            <p className={styles.customer}>{trans.customer_vendor}</p>
          </div>
          <div className={`${styles.meta} ${styles.textRight}`}>
            <p><strong>Ref:</strong> {trans.serial_number || trans.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Data:</strong> {new Date(trans.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colId}>ID</th>
              <th>Produto</th>
              <th className={`${styles.colQty} ${styles.textRight}`}>Qtd</th>
              <th className={`${styles.colTotal} ${styles.textRight}`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i: number) => (
              <tr key={`${linha.id ?? 'x'}-${i}`}>
                <td className={styles.colId}>{linha.id ?? '-'}</td>
                <td>{linha.name}</td>
                <td className={`${styles.qty} ${styles.textRight}`}>
                  {linha.quant.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                </td>
                <td className={styles.textRight}>
                  {formatCurrency(linha.total)}
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
          {discount > 0 && (
            <div className={styles.summaryRow}>
              <span>Desconto:</span>
              <span>{formatCurrency(discount)}</span>
            </div>
          )}
          {shipping > 0 && (
            <div className={styles.summaryRow}>
              <span>Frete:</span>
              <span>{formatCurrency(shipping)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className={styles.summaryRow}>
              <span>Imposto:</span>
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