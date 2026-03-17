'use client';

import { useState, useRef } from 'react';
import styles from './OperationModal.module.css';
import { useStockActions } from '@/hooks/useStockActions';
import { parseScaleBarcode } from '@/utils/barcodeParser';

export function OperationModal({ products, onSuccess, onClose }: any) {
  const { registerBatchOperations } = useStockActions();
  const [barcode, setBarcode] = useState('');
  const [items, setItems] = useState<any[]>([]); // Lista de itens bipados
  const [type, setType] = useState<'IN' | 'OUT'>('OUT');
  const [customer, setCustomer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setBarcode(code);

    if (code.length === 13) {
      const result = parseScaleBarcode(code);
      if (result) {
        const product = products.find((p: any) => Number(p.id) === result.productId);
        if (product) {
          // Adiciona à lista local em vez de enviar pro banco
          setItems(prev => [{
            ...result,
            name: product.name,
            tempId: Date.now() // ID temporário para o map
          }, ...prev]);
          setBarcode(''); // Limpa para o próximo bip
        } else {
          alert("Produto não cadastrado!");
          setBarcode('');
        }
      }
    }
  };

  const handleFinalize = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = items.map(item => ({
        product_id: item.productId,
        type: type,
        quant: item.weightKg,
        customer: customer
      }));

      await registerBatchOperations(payload);
      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro ao salvar lote");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (tempId: number) => {
    setItems(items.filter(i => i.tempId !== tempId));
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard} style={{ maxWidth: '600px' }}>
        <div className={styles.header}>
          <h2 className="text-lg font-bold">Venda em Lote (Multi-Bip)</h2>
          <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        </div>

        <div className={styles.form}>
          <div className="grid grid-cols-2 gap-4">
             <div className={styles.inputGroup}>
                <label className={styles.label}>Responsável</label>
                <input 
                  className={styles.input} 
                  value={customer} 
                  onChange={e => setCustomer(e.target.value)}
                  placeholder="Nome do cliente"
                />
             </div>
             <div className={styles.inputGroup}>
                <label className={styles.label}>Tipo da Operação</label>
                <div className="flex gap-2">
                   <button 
                    type="button" 
                    onClick={() => setType('IN')}
                    className={`${styles.typeBtn} ${type === 'IN' ? styles.activeIn : ''}`}
                   >Entrada</button>
                   <button 
                    type="button" 
                    onClick={() => setType('OUT')}
                    className={`${styles.typeBtn} ${type === 'OUT' ? styles.activeOut : ''}`}
                   >Saída</button>
                </div>
             </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Aguardando Leitura...</label>
            <input
              type="text"
              autoFocus
              className={styles.input}
              style={{ fontSize: '20px', textAlign: 'center', borderColor: '#3b82f6' }}
              value={barcode}
              onChange={handleBarcodeChange}
              placeholder="Bipe as etiquetas uma após a outra"
            />
          </div>

          {/* LISTA DE ITENS BIPADOS */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
            {items.map(item => (
              <div key={item.tempId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{item.weightKg.toFixed(2)} KG</div>
                </div>
                <button 
                  onClick={() => removeItem(item.tempId)}
                  style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}
                >&times;</button>
              </div>
            ))}
          </div>

          <div className={styles.buttonGroup}>
            <button onClick={onClose} className={styles.btnSecondary}>Cancelar</button>
            <button 
              onClick={handleFinalize} 
              disabled={loading || items.length === 0}
              className={styles.btnPrimary}
            >
              {loading ? 'Finalizando...' : `Finalizar (${items.length} itens)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}