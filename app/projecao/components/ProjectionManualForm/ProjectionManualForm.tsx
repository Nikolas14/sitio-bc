'use client';

import { forwardRef } from 'react';
import styles from './ProjectionManualForm.module.css';

interface ProjectionManualFormProps {
  manualId: string;
  setManualId: (val: string) => void;
  manualQuant: string;
  setManualQuant: (val: string) => void;
  previewProduct: any;
  addManualItem: () => void;
  lastError: string | null;
  totalKg: number;
  totalPrice: number;
}

export const ProjectionManualForm = forwardRef<HTMLInputElement, ProjectionManualFormProps>(
  ({ 
    manualId, 
    setManualId, 
    manualQuant, 
    setManualQuant, 
    previewProduct, 
    addManualItem, 
    lastError, 
    totalKg,
    totalPrice 
  }, ref) => {
    
    return (
      <div className={styles.formContainer}>
        {/* GRID DE INPUTS */}
        <div className={styles.manualInputGrid}>
          <div className={styles.inputField}>
            <label className={styles.miniLabel}>ID Produto</label>
            <input
              ref={ref}
              className={`${styles.field} ${previewProduct ? styles.inputSuccess : ''}`}
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && document.getElementById('qInput')?.focus()}
              placeholder="ID"
            />
            <div className={styles.previewArea}>
              {previewProduct ? (
                <span className={styles.foundText}>✅ {previewProduct.name}</span>
              ) : manualId ? (
                <span className={styles.errorText}>❌ Não encontrado</span>
              ) : (
                <span className={styles.idleText}>Aguardando ID...</span>
              )}
            </div>
          </div>

          <div className={styles.inputField}>
            <label className={styles.miniLabel}>Qtd (KG)</label>
            <input
              id="qInput"
              className={styles.field}
              type="number"
              value={manualQuant}
              onChange={(e) => setManualQuant(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManualItem()}
              placeholder="0.00"
            />
          </div>
        </div>

        <button className={styles.btnAdd} onClick={addManualItem}>
          Incluir na Lista
        </button>
        
        {lastError && <span className={styles.alertMsg}>⚠️ {lastError}</span>}

        {/* RESUMO FINANCEIRO E DE CARGA */}
        <div className={styles.summaryBox}>
          <div className={styles.summaryItem}>
            <span className={styles.label}>TOTAL DO ENVIO</span>
            <div className={styles.weightValue}>
              {totalKg.toFixed(2)} <small className={styles.unit}>KG</small>
            </div>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.summaryItem}>
            <span className={styles.label}>PREÇO PROJETADO</span>
            <div className={styles.priceValue}>
              <small className={styles.unit}>R$</small> {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProjectionManualForm.displayName = 'ProjectionManualForm';