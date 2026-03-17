'use client';

import styles from './OperationModal.module.css'; // Importando o módulo
import { useState } from 'react';
import { useStockActions } from '@/hooks/useStockActions';
import { IProductBalance } from '@/types';

export function OperationModal({ products, onSuccess, onClose }: any) {
  const { registerOperation } = useStockActions();
  const [formData, setFormData] = useState({ productId: '', type: 'IN', quant: 1, customer: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerOperation({
        product_id: Number(formData.productId),
        type: formData.type as 'IN' | 'OUT',
        quant: formData.quant,
        customer: formData.customer
      });
      onSuccess();
      onClose();
    } catch (err) { alert("Erro ao salvar"); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard}>
        <div className={styles.header}>
          <h2 style={{margin: 0, fontSize: '1.25rem'}}>Nova Movimentação</h2>
          <button onClick={onClose} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Produto</label>
            <select 
              className={styles.select}
              onChange={e => setFormData({...formData, productId: e.target.value})}
            >
              <option value="">Selecione...</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className={styles.buttonGroup}>
             <button 
              type="button" 
              onClick={() => setFormData({...formData, type: 'IN'})}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: formData.type === 'IN' ? '#22c55e' : '#e2e8f0', background: formData.type === 'IN' ? '#f0fdf4' : 'white'}}
             >Entrada</button>
             <button 
              type="button" 
              onClick={() => setFormData({...formData, type: 'OUT'})}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: formData.type === 'OUT' ? '#ef4444' : '#e2e8f0', background: formData.type === 'OUT' ? '#fef2f2' : 'white'}}
             >Saída</button>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Quantidade</label>
            <input 
              type="number" 
              className={styles.input}
              onChange={e => setFormData({...formData, quant: Number(e.target.value)})}
              value={formData.quant}
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary}>Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  );
}