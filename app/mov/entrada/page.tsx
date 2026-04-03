'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { parseScaleBarcode } from '@/utils/barcodeParser';
import BarcodeScanner from '../components/BarcodeScanner/BarcodeScanner';
import InventoryCart from '../components/InventoryCart/InventoryCart';
import ButtonFinish from '../components/ButtonFinish/ButtonFinish';
import HeaderInput from '@/components/HeaderInput/HeaderInput';

export default function EntradaSimplificadaPage() {
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

      alert("Entrada enviada para o estoque!");
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

      <aside className={styles.leftPanel}>
        <div className={styles.controlTop}>
          <HeaderInput
            titulo="Entrada"
            labelDescricao="Quantidade abate"
            valor={customer}
            setValor={setCustomer}
            placeholder="50 Bois/ 900 Frangos"
          />
          <BarcodeScanner
            ref={inputRef}
            barcode={barcode}
            onChange={handleBarcode}
          />
        </div>

        <ButtonFinish
          onClick={finalizarVenda}
          loading={loading}
          disabled={items.length === 0}
        />
      </aside>

      <main className={styles.cartWrapper}>
        <InventoryCart
          tituloCart="Conferência de Entrada"
          items={items}
          setItems={setItems}
          totalWeight={financial.totalKg}
          isVenda={false} // <--- Mostra apenas o peso
        />
      </main>
    </div>
  );
}