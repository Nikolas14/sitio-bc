'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory'; 
import { parseScaleBarcode } from '@/utils/barcodeParser';

export default function EntradaSimplesPage() {
  const router = useRouter();
  const { products } = useInventory();

  const [vendor, setVendor] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Soma de quantidade (KG) e total de itens
  const summary = useMemo(() => {
    const totalKg = items.reduce((acc, item) => acc + item.weightKg, 0);
    return { totalKg, count: items.length };
  }, [items]);

  const handleBip = (val: string) => {
    setBarcode(val);
    if (val.length === 13) {
      const parsed = parseScaleBarcode(val);
      if (parsed) {
        const prod = products.find(p => p.id === parsed.productId);
        if (prod) {
          setItems(prev => [{
            ...parsed,
            name: prod.name,
            tempId: Date.now()
          }, ...prev]);
        }
        setBarcode('');
      }
    }
  };

  const salvarEntrada = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      // 1. Criar Transação (Cabeçalho)
      const { data: trans, error: transError } = await supabase
        .from('ESTOQUE_transaction')
        .insert([{
          type: 'IN',
          customer_vendor: vendor || 'FORNECEDOR NÃO INFORMADO',
          total_kg: summary.totalKg,
          total_price: 0 // Preço não entra agora
        }])
        .select()
        .single();

      if (transError) throw transError;

      // 2. Criar Operações (Itens)
      const operations = items.map(item => ({
        transaction_id: trans.id,
        product_id: item.productId,
        type: 'IN',
        quant: item.weightKg
      }));

      const { error: opError } = await supabase
        .from('ESTOQUE_operation')
        .insert(operations);

      if (opError) throw opError;

      alert("Estoque atualizado com sucesso!");
      setItems([]);
      setVendor('');
      inputRef.current?.focus();

    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      {/* ESQUERDA: CONTROLES */}
      <aside className={styles.leftPanel}>
        <header className="mb-8">
          <button onClick={() => router.push('/')} className="text-[10px] font-black text-slate-400 mb-2 uppercase">← Sair</button>
          <h1 className="text-3xl font-black italic text-slate-800">ENTRADA</h1>
        </header>

        <label className={styles.inputLabel}>Nome do Fornecedor</label>
        <input 
          className={styles.inputField}
          value={vendor}
          onChange={e => setVendor(e.target.value)}
          placeholder="Ex: Frigorífico Estrela"
        />

        <div className={styles.barcodeBox}>
          <label className={styles.inputLabel}>Bipe a Etiqueta</label>
          <input 
            ref={inputRef}
            className={styles.bigInput}
            value={barcode}
            onChange={e => handleBip(e.target.value)}
            autoFocus
            placeholder="0000000000000"
          />
        </div>

        <div className={styles.totalSection}>
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">Peças:</span>
            <span className="font-bold">{summary.count}</span>
          </div>
          <div className="flex justify-between mb-8">
            <span className="text-[10px] font-black text-slate-400 uppercase">Peso Total:</span>
            <span className="text-2xl font-black">{summary.totalKg.toFixed(3)} KG</span>
          </div>
          
          <button 
            className={styles.submitBtn}
            onClick={salvarEntrada}
            disabled={loading || items.length === 0}
          >
            {loading ? 'Processando...' : 'Finalizar Entrada'}
          </button>
        </div>
      </aside>

      {/* DIREITA: LISTA DE CONFERÊNCIA */}
      <main className={styles.rightPanel}>
        <h2 className="font-black text-slate-400 text-sm uppercase mb-6 tracking-widest">Itens Bipados</h2>
        
        {items.map(item => (
          <div key={item.tempId} className={styles.itemRow}>
            <div>
              <p className="text-[9px] font-black text-slate-300">ID {item.productId}</p>
              <p className="font-bold text-sm uppercase text-slate-700">{item.name}</p>
            </div>
            <div className="flex items-center gap-6">
              <span className="font-black text-xl text-slate-800">{item.weightKg.toFixed(3)} KG</span>
              <button 
                onClick={() => setItems(items.filter(i => i.tempId !== item.tempId))}
                className="text-slate-300 hover:text-red-500 font-bold text-xl"
              >
                &times;
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-10">
            <p className="text-6xl font-black uppercase">Aguardando Bips</p>
          </div>
        )}
      </main>
    </div>
  );
}