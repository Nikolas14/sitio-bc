'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useInventory } from '@/hooks/useInventory';
import { useStockActions } from '@/hooks/useStockActions';
import { parseScaleBarcode } from '@/utils/barcodeParser';

export default function EntradaPage() {
  const router = useRouter();
  const { products } = useInventory();
  const { registerBatchOperations } = useStockActions();

  const [barcode, setBarcode] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [origin, setOrigin] = useState(''); // Ex: Fornecedor ou Frigorífico
  const [loading, setLoading] = useState(false);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Atalho F10 para salvar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10' && items.length > 0 && !loading) {
        e.preventDefault();
        handleSaveEntry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, loading]);

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

  const handleSaveEntry = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      // Registra como ENTRADA (IN)
      await registerBatchOperations(items.map(i => ({
        product_id: i.productId,
        type: 'IN', // <--- Importante: Diferente do caixa
        quant: i.weightKg,
        customer: origin || 'Entrada de Mercadoria'
      })));

      alert("Entrada de estoque realizada com sucesso!");
      
      // Limpa para a próxima carga
      setItems([]);
      setOrigin('');
      setBarcode('');
      barcodeInputRef.current?.focus();

    } catch (err) {
      alert("Erro ao salvar entrada.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* PAINEL ESQUERDO: CONTROLES */}
      <aside className={styles.leftPanel}>
        <div>
          <button onClick={() => router.push('/')} className="text-xs font-black text-slate-400 mb-6 uppercase">← Voltar</button>
          <h1 className="text-3xl font-black italic tracking-tighter text-green-700">ENTRADA DE CARGA</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Abastecimento de Estoque</p>

          <div className="mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase">Origem / Fornecedor</label>
            <input 
              className="w-full p-3 bg-slate-100 rounded-lg mt-1 font-bold outline-none focus:ring-2 ring-green-500"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="Ex: Frigorífico Estrela"
            />
          </div>

          <div className={styles.barcodeBox}>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-2 text-center">Bipe o código da etiqueta</label>
            <input 
              ref={barcodeInputRef}
              className={styles.bigInput}
              autoFocus
              value={barcode}
              onChange={handleBarcodeChange}
              placeholder="0000000000000"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between font-black text-slate-400 text-xs mb-4 uppercase">
            <span>Total de Peças: {items.length}</span>
            <span>Peso: {items.reduce((acc, i) => acc + i.weightKg, 0).toFixed(3)} KG</span>
          </div>
          <button 
            className={styles.finishBtn}
            onClick={handleSaveEntry}
            disabled={loading || items.length === 0}
          >
            {loading ? 'SALVANDO...' : 'Confirmar Entrada (F10)'}
          </button>
        </div>
      </aside>

      {/* PAINEL DIREITO: LISTA DE CONFERÊNCIA */}
      <main className={styles.rightPanel}>
        <h2 className="font-black text-slate-400 text-sm uppercase mb-6 tracking-widest">Conferência de Carga Atual</h2>
        
        {items.map(item => (
          <div key={item.tempId} className={styles.itemRow}>
            <div>
              <p className="text-[9px] font-black text-slate-300">CÓD: {item.productId}</p>
              <p className={styles.itemName}>{item.name}</p>
            </div>
            <div className="flex items-center gap-8">
              <span className={styles.itemWeight}>{item.weightKg.toFixed(3)} KG</span>
              <button 
                onClick={() => setItems(items.filter(i => i.tempId !== item.tempId))}
                className={styles.removeBtn}
              >
                &times;
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <span className="text-8xl">📥</span>
            <p className="font-black mt-4 uppercase">Aguardando bips de entrada...</p>
          </div>
        )}
      </main>
    </div>
  );
}