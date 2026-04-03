'use client';

import { IProduct } from '@/types';
import styles from './ProductSidebarList.module.css';
import ProductListItem from '../ProductListItem/ProductListItem';


interface ProductSidebarListProps {
  products: IProduct[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const ProductSidebarList = ({ 
  products, 
  loading, 
  selectedId, 
  onSelect 
}: ProductSidebarListProps) => {
  
  if (loading) {
    return <div className={styles.loadingPulse}>CARREGANDO LISTA...</div>;
  }

  if (products.length === 0) {
    return <div className={styles.emptyList}>Nenhum produto encontrado.</div>;
  }

  return (
    <div className={styles.scrollArea}>
      {products.map((p) => (
        <ProductListItem 
          key={p.id}
          product={p}
          isSelected={selectedId === p.id}
          onClick={onSelect}
        />
      ))}
    </div>
  );
};

export default ProductSidebarList;