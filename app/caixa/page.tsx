'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useInventory } from '@/hooks/useInventory';
import { useStockActions } from '@/hooks/useStockActions';
import { parseScaleBarcode } from '@/utils/barcodeParser';
import { supabase } from '@/api/supabase';

export default function CaixaPage() {
  const router = useRouter();
  const { products } = useInventory();
  const { registerBatchOperations } = useStockActions();

  // Estados da Venda
  const [barcode, setBarcode] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState('');
  const [loading, setLoading] = useState(false);

  // Referência para o input (vital para resetar o foco)
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Atalho de Teclado (F10 para finalizar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10' && items.length > 0 && !loading) {
        e.preventDefault();
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, customer, loading]);

  // Lógica de bipagem
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
            price: product.price || 0,
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
    setLoading(true);

    try {
      const totalKg = items.reduce((acc, i) => acc + i.weightKg, 0);
      const subTotal = items.reduce((acc, i) => acc + (i.weightKg * i.price), 0);

      // 1. Criar o cabeçalho do Faturamento (Status: ENVIADO)
      const { data: fatura, error: fatError } = await supabase
        .from('faturamento')
        .insert([{
          customer: customer || 'Consumidor Final',
          total_kg: totalKg,
          priceTotal: subTotal,
          status: 'ENVIADO'
        }])
        .select()
        .single();

      if (fatError) throw fatError;

      // 2. Criar os itens vinculados à fatura
      const itensPayload = items.map(item => ({
        faturamento_id: fatura.id,
        product_id: item.productId,
        product_name: item.name,
        quant: item.weightKg,
        price_unit: item.price,
        price_total: item.weightKg * item.price
      }));

      const { error: itensError } = await supabase
        .from('faturamento_itens')
        .insert(itensPayload);

      if (itensError) throw itensError;

      // 3. Registrar saída no estoque (operation_new)
      await registerBatchOperations(items.map(i => ({
        product_id: i.productId,
        type: 'OUT',
        quant: i.weightKg,
        customer: customer || 'Venda PDV'
      })));

      // --- SUCESSO E LIMPEZA DA TELA ---
      console.log("Venda finalizada:", fatura.serial_number);
      
      // Reseta os estados para nova compra
      setItems([]);
      setCustomer('');
      setBarcode('');
      
      // Devolve o foco para o input
      barcodeInputRef.current?.focus();

    } catch (err) {
      console.error(err);
      alert("Erro ao processar venda.");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (tempId: number) => {
    setItems(items.filter(i => i.tempId !== tempId));
  };

  return (
    <div className={styles.wrapper}>
      {/* PAINEL ESQUERDO: CONTROLES */}
      <aside className={styles.leftPanel}>
        <div className="flex justify-between items-center">
          <button onClick={() => router.push('/')} className={styles.backBtn}>← Voltar</button>
          <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded">MODO CAIXA</span>
        </div>

        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">FRENTE DE CAIXA</h1>

        <div className={styles.barcodeSection}>
          <label className={styles.label}>AGUARDANDO LEITURA</label>
          <input 
            ref={barcodeInputRef}
            className={styles.bigInput} 
            autoFocus 
            value={barcode} 
            onChange={handleBarcodeChange} 
            placeholder="Bipe o código..."
            autoComplete="off"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>NOME DO CONSUMIDOR (OPCIONAL)</label>
          <input 
            className={styles.input} 
            value={customer} 
            onChange={e => setCustomer(e.target.value)}
            placeholder="Ex: João Silva"
          />
        </div>

        <div className={styles.summary}>
          <div className="flex justify-between text-sm opacity-70">
            <span>Total de Itens:</span>
            <span>{items.length}</span>
          </div>
          <div className="flex justify-between text-xl font-black border-t border-white/20 pt-2">
            <span>PESO TOTAL:</span>
            <span>{items.reduce((acc, i) => acc + i.weightKg, 0).toFixed(3)} KG</span>
          </div>
          <button 
            className={styles.finishBtn} 
            onClick={handleFinish}
            disabled={loading || items.length === 0}
          >
            {loading ? 'GRAVANDO...' : 'FINALIZAR (F10)'}
          </button>
        </div>
      </aside>

      {/* PAINEL DIREITO: LISTA DE ITENS (CARRINHO) */}
      <main className={styles.rightPanel}>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-black text-slate-400 text-sm tracking-widest uppercase">Itens da Venda Atual</h2>
          <span className="text-xs font-bold text-slate-400">Pressione X para remover</span>
        </div>

        <div className={styles.cartContainer}>
          {items.map(item => (
            <div key={item.tempId} className={styles.itemRow}>
              <div>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemSub}>PREÇO UNIT: R$ {item.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className={styles.itemWeight}>{item.weightKg.toFixed(3)} KG</span>
                  <span className="block text-[10px] font-black text-blue-500">
                    R$ {(item.weightKg * item.price).toFixed(2)}
                  </span>
                </div>
                <button onClick={() => removeItem(item.tempId)} className={styles.removeBtn}>&times;</button>
              </div>
            </div>
          ))}

          {items.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <span className="text-8xl">🛒</span>
              <p className="font-black mt-4">PRONTO PARA NOVA COMPRA</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}