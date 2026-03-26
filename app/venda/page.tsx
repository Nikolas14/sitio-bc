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
const displayItems = [...items].reverse();
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
          customer_vendor: customer || 'LOJA_BC',
          total_price: financial.subtotal,
          total_kg: financial.totalKg,
          discount_percent: discountPercent,
          shipping_cost: 0,
          tax_amount: 0
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
          <header className={styles.header}>
            <button onClick={() => router.push('/')}>← Voltar</button>
            <h1>CAIXA</h1>
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
              placeholder="Cod. barras"
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
      {/* Cabeçalho com Total Geral */}
      <div className={styles.headerCart}>
        <h2 className={styles.titleCart}>Produtos no Carrinho</h2>
        <p className={styles.totalWeight}>{financial.totalKg.toFixed(3)} KG</p>
      </div>

      {/* Lista de Itens */}
      {displayItems.length > 0 ? (
        displayItems.map((item) => (
          <div key={item.tempId} className={styles.itemRow}>
            
            {/* Informação do Produto */}
            <div className={styles.productInfo}>
              <p className={styles.labelSmall}>ID {item.productId}</p>
              <h3 className={styles.itemName}>{item.name}</h3>
            </div>

            <div className={styles.itemActions}>
              {/* Preço por Unidade/KG */}
              <div className={styles.dataColumn}>
                <p className={styles.labelSmall}>Preço/KG</p>
                <p className={styles.valueMain}>R$ {item.price.toFixed(2)}</p>
              </div>

              {/* Quantidade Bipada */}
              <div className={styles.dataColumn}>
                <p className={styles.labelSmall}>QTD</p>
                <p className={styles.valueMain}>{item.weightKg.toFixed(3)} KG</p>
              </div>

              {/* Subtotal (Preço * Peso) */}
              <div className={styles.dataColumn}>
                <p className={styles.labelSmall}>Subtotal</p>
                <p className={styles.subtotalValue}>
                  R$ {(item.price * item.weightKg).toFixed(2)}
                </p>
              </div>

              {/* Ação de Remover */}
              <button
                onClick={() => setItems(items.filter((i) => i.tempId !== item.tempId))}
                className={styles.removeBtn}
                title="Remover este item"
              >
                &times;
              </button>
            </div>
          </div>
        ))
      ) : (
        <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '40px' }}>
          Nenhum produto bipado ainda.
        </p>
      )}
    </main>
    </div>
  );
}