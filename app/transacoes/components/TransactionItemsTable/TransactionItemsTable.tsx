'use client';

import React from 'react';
import styles from './TransactionItemsTable.module.css';
import { IOperation } from '@/types/index';

interface TransactionItemsTableProps {
  items: IOperation[];
  loading?: boolean;
  type?: 'IN' | 'OUT'; // Adicionamos o tipo para saber se é entrada ou saída
}

interface GroupedItem {
  key: string;
  name: string;
  price: number;
  quantity: number;
  labels: number;
}

// Soma etiquetas do mesmo produto; preço diferente vira linha separada para o total bater.
function groupItems(items: IOperation[]): GroupedItem[] {
  const groups = new Map<string, GroupedItem>();

  for (const item of items) {
    const price = Number(item.unit_price ?? item.ESTOQUE_product?.price ?? 0);
    const key = `${item.product_id}-${price}`;
    const current = groups.get(key);

    if (current) {
      current.quantity += Number(item.quant || 0);
      current.labels += 1;
    } else {
      groups.set(key, {
        key,
        name: item.ESTOQUE_product?.name || 'Produto não encontrado',
        price,
        quantity: Number(item.quant || 0),
        labels: 1,
      });
    }
  }

  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const TransactionItemsTable = ({ items, loading, type }: TransactionItemsTableProps) => {
  if (loading) {
    return <div className={styles.loading}>Carregando itens...</div>;
  }

  // Definimos se devemos mostrar o financeiro (apenas se não for entrada)
  const showFinance = type !== 'IN';

  return (
    <table className={styles.itemTable}>
      <thead>
        <tr>
          <th>Produto</th>
          {showFinance && <th className="text-center">Preço/KG</th>}
          <th className="text-center">Qtd (KG)</th>
          {showFinance && <th className="text-right">Total Item</th>}
        </tr>
      </thead>
      <tbody>
        {groupItems(items).map(({ key, name, price, quantity, labels }) => {
          const totalItem = price * quantity;

          return (
            <tr key={key}>
              <td className={styles.productName}>
                {name}
                {labels > 1 && <span className={styles.labelCount}>{labels} etiquetas</span>}
              </td>
              
              {/* Coluna de Preço Condicional */}
              {showFinance && (
                <td className={styles.centerCol}>
                  R$ {price.toFixed(2)}
                </td>
              )}

              <td className={`${styles.centerCol} ${styles.weight}`}>
                {quantity.toFixed(3)}
              </td>

              {/* Coluna de Total Condicional */}
              {showFinance && (
                <td className={styles.rightCol}>
                  R$ {totalItem.toFixed(2)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default TransactionItemsTable;