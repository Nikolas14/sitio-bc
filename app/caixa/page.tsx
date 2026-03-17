'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useInventory } from '@/hooks/useInventory';
import { useStockActions } from '@/hooks/useStockActions';
import { parseScaleBarcode } from '@/utils/barcodeParser';
import { IOperation } from '@/types';

export default function CaixaPage() {
  const router = useRouter();
  const { products } = useInventory();
  const { registerBatchOperations, loading } = useStockActions();

  const [barcode, setBarcode] = useState('');
  const [items, setItems] = useState<any[]>([]);
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
          alert("Produto não encontrado!");
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
        type: 'OUT' as 'IN' | 'OUT', // Resolvendo erro de Type
        quant: i.weightKg,
        customer: 'Venda PDV'
      }));

      await registerBatchOperations(payload);
      alert("Venda finalizada com sucesso!");
      setItems([]);
      barcodeInputRef.current?.focus();
    } catch (err) {
      alert("Erro ao finalizar venda.");
    }
  };

  return (
    <div className={styles.wrapper} style={{ borderTop: '8px solid #3b82f6' }}>
      <aside className={styles.leftPanel}>
        <button onClick={() => router.push('/')} className={styles.backBtn}>← Sair do Caixa</button>
        <h1 style={{ color: '#1e3a8a', fontWeight: '900', fontSize: '28px' }}>CAIXA / PDV</h1>

        <div className={styles.barcodeSection} style={{ borderColor: '#3b82f6' }}>
          <label className={styles.label}>PASSE O LEITOR</label>
          <input 
            ref={barcodeInputRef}
            className={styles.bigInput} 
            autoFocus 
            value={barcode} 
            onChange={handleBarcodeChange} 
            placeholder="Aguardando bip..."
          />
        </div>

        <div className={styles.summary} style={{ background: '#0f172a' }}>
          <div className={styles.totalRow}>
            <span>Itens no Carrinho:</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>{items.length}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Peso Total:</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa' }}>
              {items.reduce((acc, i) => acc + i.weightKg, 0).toFixed(2)} KG
            </span>
          </div>
          <button 
            className={styles.finishBtn} 
            style={{ background: '#3b82f6' }}
            onClick={handleFinish}
            disabled={loading || items.length === 0}
          >
            {loading ? 'GRAVANDO...' : 'FINALIZAR VENDA'}
          </button>
        </div>
      </aside>

      <main className={styles.rightPanel}>
        <h2 className={styles.panelTitle}>CARRINHO DE COMPRAS</h2>
        <div className={styles.cartContainer}>
          {items.map(item => (
            <div key={item.tempId} className={styles.itemRow}>
              <div>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemSub}>PESO: {item.weightKg.toFixed(2)} KG</span>
              </div>
              <div className={styles.itemRight}>
                <button onClick={() => setItems(items.filter(i => i.tempId !== item.tempId))} className={styles.removeBtn}>&times;</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.3 }}>
              <p style={{ fontSize: '60px' }}>🛒</p>
              <p>Carrinho vazio</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}