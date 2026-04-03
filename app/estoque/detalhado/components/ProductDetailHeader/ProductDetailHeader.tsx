'use client';

import styles from './ProductDetailHeader.module.css';

interface ProductDetailHeaderProps {
  name: string;
  type?: string;
  currentStock: number | string;
  totalIn: number;
  totalOut: number;
}

const ProductDetailHeader = ({ 
  name, 
  type, 
  currentStock, 
  totalIn, 
  totalOut 
}: ProductDetailHeaderProps) => {
  return (
    <header className={styles.detailHeader}>
      <div className={styles.titleInfo}>
        <span className={styles.categoryTag}>
          {type || 'GERAL'}
        </span>
        <h2 className={styles.mainProductName}>{name}</h2>
        <div className={styles.miniStats}>
          <p className={styles.statIn}>
            Entradas: <strong>+{totalIn.toFixed(3)}kg</strong>
          </p>
          <p className={styles.statOut}>
            Saídas: <strong>-{totalOut.toFixed(3)}kg</strong>
          </p>
        </div>
      </div>

      <div className={styles.stockSummary}>
        <div className={styles.largeStock}>
          <p className={styles.labelLabel}>Saldo Disponível</p>
          <p className={styles.stockValueNumber}>
            {Number(currentStock).toFixed(3)}
            <span className={styles.unit}>KG</span>
          </p>
        </div>
      </div>
    </header>
  );
};

export default ProductDetailHeader;