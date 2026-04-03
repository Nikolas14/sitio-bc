'use client';

import React from 'react';
import styles from './TransactionItemsTable.module.css';
import { IOperation } from '@/types/index';

interface TransactionItemsTableProps {
  items: IOperation[];
  loading?: boolean;
  type?: 'IN' | 'OUT'; // Adicionamos o tipo para saber se é entrada ou saída
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
        {items.map((item) => {
          const price = Number(item.ESTOQUE_product?.price || 0);
          const quantity = Number(item.quant || 0);
          const totalItem = price * quantity;

          return (
            <tr key={item.id}>
              <td className={styles.productName}>
                {item.ESTOQUE_product?.name || 'Produto não encontrado'}
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