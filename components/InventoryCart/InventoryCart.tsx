'use client';

import styles from './InventoryCart.module.css';

interface CartItem {
  tempId: string | number;
  productId: string | number;
  name: string;
  weightKg: number;
  price?: number; // Agora o preço é opcional
}

interface InventoryCartProps {
  tituloCart: string;
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  totalWeight: number;
  isVenda?: boolean; // Nova prop para saber se deve focar em valores
}

export default function InventoryCart({ 
  tituloCart, 
  items, 
  setItems, 
  totalWeight,
  isVenda = false 
}: InventoryCartProps) {
  
  const removeItem = (tempId: string | number) => {
    setItems(items.filter((i) => i.tempId !== tempId));
  };

  return (
    <main className={styles.rightPanel}>
      <header className={styles.headerCart}>
        <div className={styles.titleInfo}>
          <h2 className={styles.titleCart}>{tituloCart}</h2>
          <span className={styles.itemBadge}>{items.length} itens</span>
        </div>
        <div className={styles.totalBox}>
          <p className={styles.labelTotal}>Total Acumulado</p>
          <p className={styles.totalWeight}>{totalWeight.toFixed(3)} <small>KG</small></p>
        </div>
      </header>

      <div className={styles.itemsList}>
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.tempId} className={styles.itemRow}>
              <div className={styles.productInfo}>
                <span className={styles.productId}>ID - {item.productId}</span>
                <h3 className={styles.itemName}>{item.name}</h3>
                
                {/* Se for venda, mostra o preço unitário logo abaixo do nome */}
                {isVenda && item.price && (
                  <span className={styles.unitPrice}>
                    Preço Unit: R$ {item.price.toFixed(2)} / KG
                  </span>
                )}
              </div>

              <div className={styles.itemActions}>
                {/* Coluna de Peso */}
                <div className={styles.dataColumn}>
                  <p className={styles.labelSmall}>PESO</p>
                  <p className={styles.subtotalValue}>{item.weightKg.toFixed(3)} KG</p>
                </div>

                {/* Coluna de Subtotal (Apenas se for Venda e tiver preço) */}
                {isVenda && item.price && (
                  <div className={styles.dataColumn}>
                    <p className={styles.labelSmall}>SUBTOTAL</p>
                    <p className={`${styles.subtotalValue} ${styles.priceHighlight}`}>
                      R$ {(item.price * item.weightKg).toFixed(2)}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => removeItem(item.tempId)}
                  className={styles.removeBtn}
                  title="Remover Item"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛒</div>
            <h3>Carrinho Vazio</h3>
            <p>Aguardando leitura do código de barras.</p>
          </div>
        )}
      </div>
    </main>
  );
}