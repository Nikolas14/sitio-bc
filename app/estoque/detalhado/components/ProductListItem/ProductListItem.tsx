'use client';

import React from 'react';
import styles from './ProductListItem.module.css';
import { IProduct } from '@/types';

interface ProductListItemProps {
  product: IProduct;
  isSelected: boolean;
  onClick: (id: number) => void;
}

const ProductListItem = ({ product, isSelected, onClick }: ProductListItemProps) => {
  const stock = Number(product.current_stock);

  return (
    <div 
      className={`${styles.compactRow} ${isSelected ? styles.activeRow : ''}`}
      onClick={() => onClick(product.id)}
    >
      <div className={styles.productInfoText}>
        <span className={styles.idLabel}>ID {product.id}</span>
        <p className={styles.productNameText}>{product.name}</p>
      </div>
      
      <p className={`${styles.stockBadge} ${stock > 0 ? styles.positive : styles.neutral}`}>
        {stock.toFixed(2)}
      </p>
    </div>
  );
};

// React.memo evita re-renderizações desnecessárias da lista
export default React.memo(ProductListItem);