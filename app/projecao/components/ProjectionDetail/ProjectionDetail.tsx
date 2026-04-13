'use client';

import styles from './ProjectionDetail.module.css';

interface ProjectionDetailProps {
  selectedRef: string | null;
  activeItems: any[];
  onDelete: () => void;
}

export default function ProjectionDetail({ 
  selectedRef, 
  activeItems, 
  onDelete 
}: ProjectionDetailProps) {
  
  if (!selectedRef) {
    return (
      <main className={styles.contentWrapper}>
        <div className={styles.emptyState}>
          <h2>Selecione uma carga para conferir</h2>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.contentWrapper}>
      <div className={styles.detailCard}>
        <header className={styles.detailHeader}>
          <h1 className={styles.detailTitle}>{selectedRef}</h1>
          <button className={styles.btnTrash} onClick={onDelete}>
            🗑️ Excluir
          </button>
        </header>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Produto</th>
              <th className={styles.textRight}>Qtd</th>
            </tr>
          </thead>
          <tbody>
            {activeItems.map((item: any) => (
              <tr key={item.id}>
                <td className={styles.prodName}>{item.ESTOQUE_product?.name}</td>
                <td className={styles.prodQuant}>{item.quant.toFixed(2)} KG</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}