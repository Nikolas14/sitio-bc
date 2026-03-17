'use client';

import { useState } from 'react';
import styles from './InventoryList.module.css';
import { useInventory } from '@/hooks/useInventory';
import { OperationHistory } from './OperationHistory';

export function InventoryList() {
  const { products, loading, refreshStock } = useInventory();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (loading) return <div className={styles.loading}>Sincronizando banco de dados...</div>;

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStockClass = (quantity: number) => {
    if (quantity <= 0) return styles.stockDanger;
    if (quantity < 5) return styles.stockWarning;
    return styles.stockSafe;
  };

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th}>Produto</th>
            <th className={`${styles.th} text-center`}>Entradas</th>
            <th className={`${styles.th} text-center`}>Saídas</th>
            <th className={`${styles.th} text-right`}>Saldo</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <React.Fragment key={p.id}>
              {/* Linha Principal - Clicável */}
              <tr className={styles.rowMain} onClick={() => toggleExpand(p.id)}>
                <td className={styles.td}>
                  <span className={styles.productName}>{p.name}</span>
                  <span className={styles.productType}>{p.type || 'Geral'}</span>
                </td>
                <td className={styles.td} style={{textAlign: 'center', color: '#16a34a'}}>
                  +{p.total_in}
                </td>
                <td className={styles.td} style={{textAlign: 'center', color: '#dc2626'}}>
                  -{p.total_out}
                </td>
                <td className={styles.td} style={{textAlign: 'right'}}>
                  <span className={`${styles.badge} ${getStockClass(p.current_stock)}`}>
                    {p.current_stock} un
                  </span>
                </td>
              </tr>

              {/* Linha de Expansão (Histórico com botão de pagar/apagar) */}
              {expandedId === p.id && (
                <tr className={styles.expandedRow}>
                  <td colSpan={4}>
                    <div className={styles.expandedContainer}>
                      <OperationHistory 
                        productId={p.id} 
                        onUpdate={refreshStock} 
                      />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      
      {products.length === 0 && (
        <div className={styles.loading}>Nenhum produto encontrado.</div>
      )}
    </div>
  );
}

// Nota: Importar React para usar o Fragment se necessário
import React from 'react';