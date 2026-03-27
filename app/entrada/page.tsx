'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { parseScaleBarcode } from '@/utils/barcodeParser';

export default function EntradaSimplificadaPage() {
  const router = useRouter();
  const { products } = useInventory();

  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Itens invertidos para o último bipado aparecer no topo
  const displayItems = useMemo(() => [...items].reverse(), [items]);

  // Cálculos Financeiros
  const financial = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.weightKg), 0);
    const totalKg = items.reduce((acc, item) => acc + item.weightKg, 0);
    const totalFinal = subtotal;

    return { subtotal, totalKg, totalFinal };
  }, [items]);

  // Atalho de teclado para finalizar (F10)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10' && items.length > 0 && !loading) {
        e.preventDefault();
        finalizarVenda();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, loading, financial]);

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
      // 1. Criar Cabeçalho da Venda
      const { data: trans, error: transError } = await supabase
        .from('ESTOQUE_transaction')
        .insert([{
          type: 'OUT',
          customer_vendor: customer || 'LOJA_BC',
          total_price: financial.totalFinal,
          total_kg: financial.totalKg,
          discount_percent: 0,
          status: 'PENDENTE'
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

      alert("Venda enviada para cobrança!");
      setItems([]);
      setCustomer('');
      inputRef.current?.focus();

    } catch (err: any) {
      alert("Erro ao salvar venda: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      {/* PAINEL DE CONTROLE (ESQUERDA) - FIXO */}
      <aside className={styles.leftPanel}>
        <div className={styles.controlTop}>
          <header className={styles.header}>
            <button className={styles.backBtn} onClick={() => router.push('/')}>← Voltar</button>
            <h1>ENTRADA</h1>
          </header>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Resumo</label>
            <input className={styles.field} value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Resumo do abate" />
          </div>

          <div className={styles.barcodeBox}>
            <label className={styles.label}>Bipe o Código</label>
            <input
              ref={inputRef}
              className={styles.bigInput}
              value={barcode}
              onChange={e => handleBarcode(e.target.value)}
              autoFocus
              placeholder="0000000000000"
            />
          </div>
        </div>

        <div className={styles.summary}>

          <button
            className={styles.submitBtn}
            onClick={finalizarVenda}
            disabled={loading || items.length === 0}
          >
            {loading ? 'PROCESSANDO...' : 'FINALIZAR (F10)'}
          </button>
        </div>
      </aside>

      {/* PAINEL DE ITENS (DIREITA) - ROLÁVEL */}
      <main className={styles.rightPanel}>
        <div className={styles.headerCart}>
          <h2 className={styles.titleCart}>Produtos no Carrinho ({items.length})</h2>
          <p className={styles.totalWeight}>{financial.totalKg.toFixed(3)} KG</p>
        </div>

        <div className={styles.itemsList}>
          {displayItems.length > 0 ? (
            displayItems.map((item) => (
              <div key={item.tempId} className={styles.itemRow}>
                <div className={styles.productInfo}>
                  <p className={styles.labelSmall}>ID {item.productId}</p>
                  <h3 className={styles.itemName}>{item.name}</h3>
                </div>

                <div className={styles.itemActions}>

                  <div className={styles.dataColumn}>
                    <p className={styles.labelSmall}>QTD</p>
                    <p className={styles.subtotalValue}>{item.weightKg.toFixed(3)} KG</p>
                  </div>

                  <button
                    onClick={() => setItems(items.filter((i) => i.tempId !== item.tempId))}
                    className={styles.removeBtn}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>Nenhum produto bipado ainda.</p>
              <span>Aguardando leitura do código de barras...</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}