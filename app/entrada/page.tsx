'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useInventory } from '@/hooks/useInventory';
import { useStockActions } from '@/hooks/useStockActions';
import { parseScaleBarcode } from '@/utils/barcodeParser';
import { IOperation } from '@/types';

export default function EntradaPage() {
  const router = useRouter();
  const { products } = useInventory();
  const { registerBatchOperations, loading } = useStockActions();

  const [barcode, setBarcode] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [origin, setOrigin] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setBarcode(code);

    if (code.length === 13) {
      const result = parseScaleBarcode(code);
      if (result) {
        const product = products.find(p => Number(p.id) === result.productId);
        if (product) {
          setItems(prev => [{
            ...result,
            name: product.name,
            tempId: Date.now()
          }, ...prev]);
          setBarcode('');
        } else {
          alert("Produto não cadastrado!");
          setBarcode('');
        }
      }
    }
  };

  const handleFinish = async () => {
    if (items.length === 0) return;
    
    try {
      const payload: IOperation[] = items.map(i => ({
        product_id: i.productId,
        type: 'IN' as 'IN' | 'OUT', // Resolvendo erro de Type
        quant: i.weightKg,
        customer: origin || 'Entrada de Estoque'
      }));

      await registerBatchOperations(payload);
      alert("Estoque atualizado!");
      setItems([]);
      setOrigin('');
      barcodeInputRef.current?.focus();
    } catch (err) {
      alert("Erro ao salvar entrada.");
    }
  };

  return (
    <div className={styles.wrapper} style={{ borderTop: '8px solid #22c55e' }}>
      <aside className={styles.leftPanel}>
        <button onClick={() => router.push('/')} className={styles.backBtn}>← Voltar ao Estoque</button>
        <h1 style={{ color: '#16a34a', fontWeight: '900', fontSize: '28px' }}>ENTRADA</h1>

        <div className={styles.barcodeSection} style={{ borderColor: '#22c55e' }}>
          <label className={styles.label}>LEITOR (BIPAR AGORA)</label>
          <input 
            ref={barcodeInputRef}
            className={styles.bigInput} 
            autoFocus 
            value={barcode} 
            onChange={handleBarcodeChange} 
            placeholder="0000000000000"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>FORNECEDOR / ORIGEM</label>
          <input 
            className={styles.bigInput} 
            style={{ fontSize: '16px', textAlign: 'left', borderBottom: '2px solid #22c55e' }}
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            placeholder="Ex: Frigorífico Estrela..."
          />
        </div>

        <div className={styles.summary} style={{ background: '#064e3b' }}>
          <div className={styles.totalRow}>
            <span>Itens: {items.length}</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {items.reduce((acc, i) => acc + i.weightKg, 0).toFixed(2)} KG
            </span>
          </div>
          <button 
            className={styles.finishBtn} 
            style={{ background: '#22c55e' }}
            onClick={handleFinish}
            disabled={loading || items.length === 0}
          >
            {loading ? 'SALVANDO...' : 'CONFIRMAR ENTRADA'}
          </button>
        </div>
      </aside>

      <main className={styles.rightPanel}>
        <h2 className={styles.panelTitle}>LOTE DE ENTRADA</h2>
        <div className={styles.cartContainer}>
          {items.map(item => (
            <div key={item.tempId} className={styles.itemRow}>
              <div>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemSub}>CÓDIGO: {item.productId}</span>
              </div>
              <div className={styles.itemRight}>
                <span className={styles.itemWeight}>{item.weightKg.toFixed(2)} KG</span>
                <button onClick={() => setItems(items.filter(i => i.tempId !== item.tempId))} className={styles.removeBtn}>&times;</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}