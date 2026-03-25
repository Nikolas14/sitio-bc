'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { parseScaleBarcode } from '@/utils/barcodeParser';

export default function VendaSimplificadaPage() {
  const router = useRouter();
  const { products } = useInventory();

  const [customer, setCustomer] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cálculos Financeiros
  const financial = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.weightKg), 0);
    const totalKg = items.reduce((acc, item) => acc + item.weightKg, 0);
    const discountVal = subtotal * (discountPercent / 100);
    const totalFinal = subtotal - discountVal;

    return { subtotal, totalKg, discountVal, totalFinal };
  }, [items, discountPercent]);

  const handleBarcode = (val: string) => {
    setBarcode(val);
    if (val.length === 13) {
      const parsed = parseScaleBarcode(val);
      if (parsed) {
        const prod = products.find(p => p.id === parsed.productId);
        if (prod) {
          setItems(prev => [{
            ...parsed,
            name: prod.name,
            price: prod.price || 0,
            tempId: Date.now()
          }, ...prev]);
        }
        setBarcode('');
      }
    }
  };

  const finalizarVenda = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      // 1. Criar Cabeçalho da Venda (OUT)
      const { data: trans, error: transError } = await supabase
        .from('ESTOQUE_transaction')
        .insert([{
          type: 'OUT',
          customer_vendor: customer || 'CONSUMIDOR FINAL',
          total_price: financial.subtotal,
          total_kg: financial.totalKg,
          discount_percent: discountPercent,
          shipping_cost: 0, // Resetado
          tax_amount: 0     // Resetado
        }])
        .select()
        .single();

      if (transError) throw transError;

      // 2. Criar Itens (Operações)
      const operations = items.map(item => ({
        transaction_id: trans.id,
        product_id: item.productId,
        type: 'OUT',
        quant: item.weightKg
      }));

      const { error: opError } = await supabase
        .from('ESTOQUE_operation')
        .insert(operations);

      if (opError) throw opError;

      alert("Venda finalizada!");
      setItems([]);
      setCustomer('');
      setDiscountPercent(0);
      inputRef.current?.focus();

    } catch (err: any) {
      alert("Erro ao salvar venda: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      {/* PAINEL DE CONTROLE (ESQUERDA) */}
      <aside className={styles.leftPanel}>
        <div>
          <header className="mb-8">
            <button onClick={() => router.push('/')} className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">← Dashboard</button>
            <h1 className="text-3xl font-black italic text-slate-800 tracking-tighter">CAIXA</h1>
          </header>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Cliente</label>
            <input className={styles.field} value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Nome do Cliente" />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Desconto Aplicado (%)</label>
            <input type="number" className={styles.field} value={discountPercent} onChange={e => setDiscountPercent(Number(e.target.value))} />
          </div>

          <div className={styles.barcodeBox}>
            <label className={styles.label}>Bipe o Código</label>
            <input 
              ref={inputRef}
              className={styles.bigInput}
              value={barcode}
              onChange={e => handleBarcode(e.target.value)}
              autoFocus
              placeholder="0000000"
            />
          </div>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryLine}>
            <span>Subtotal:</span>
            <span>R$ {financial.subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryLine}>
            <span>Desconto:</span>
            <span className="text-red-500">- R$ {financial.discountVal.toFixed(2)}</span>
          </div>
          
          <div className={styles.totalValue}>
            <span>TOTAL</span>
            <span>R$ {financial.totalFinal.toFixed(2)}</span>
          </div>

          <button 
            className={styles.submitBtn} 
            onClick={finalizarVenda}
            disabled={loading || items.length === 0}
          >
            {loading ? 'SALVANDO...' : 'FINALIZAR (F10)'}
          </button>
        </div>
      </aside>

      {/* PAINEL DE ITENS (DIREITA) */}
      <main className={styles.rightPanel}>
        <div className="flex justify-between items-end mb-8 border-b pb-4">
          <h2 className="font-black text-slate-400 text-sm uppercase tracking-widest">Produtos no Carrinho</h2>
          <p className="text-3xl font-black text-slate-800">{financial.totalKg.toFixed(3)} KG</p>
        </div>

        {items.map(item => (
          <div key={item.tempId} className={styles.itemRow}>
            <div>
              <p className="text-[9px] font-black text-slate-300 uppercase">ID {item.productId}</p>
              <p className="font-bold text-lg uppercase text-slate-700">{item.name}</p>
            </div>
            <div className="flex items-center gap-12">
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-300 uppercase">Preço/KG</p>
                <p className="font-bold text-sm">R$ {item.price.toFixed(2)}</p>
              </div>
              <span className="font-black text-2xl text-slate-800">{item.weightKg.toFixed(3)} KG</span>
              <button 
                onClick={() => setItems(items.filter(i => i.tempId !== item.tempId))}
                className="text-slate-200 hover:text-red-500 font-bold text-2xl"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}