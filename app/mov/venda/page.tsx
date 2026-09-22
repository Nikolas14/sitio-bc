'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { parseScaleBarcode } from '@/utils/barcodeParser';
import type { CartItem } from '../../../components/InventoryCart/InventoryCart';

import BarcodeScanner from '../../../components/BarcodeScanner/BarcodeScanner';
import InventoryCart from '../../../components/InventoryCart/InventoryCart';
import ButtonFinish from '../../../components/ButtonFinish/ButtonFinish';
import FinancialSummary from '../components/FinancialSummary/FinancialSummary';
import DiscountInput from '../../../components/DiscountInput/DiscountInput';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';

import styles from './page.module.css';

export default function VendaSimplificadaPage() {
  const { products } = useInventory();

  const [customer, setCustomer] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const financial = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + ((item.price || 0) * item.weightKg), 0);
    const totalKg = items.reduce((acc, item) => acc + item.weightKg, 0);
    const discountVal = subtotal * (discountPercent / 100);
    const totalFinal = subtotal - discountVal;

    return { subtotal, totalKg, discountVal, totalFinal };
  }, [items, discountPercent]);

  const finalizarVenda = useCallback(async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const { data: trans, error: transError } = await supabase
        .from('ESTOQUE_transaction')
        .insert([{
          type: 'OUT',
          customer_vendor: customer || 'VENDA_AVULSA',
          total_price: financial.subtotal, // Salvamos o BRUTO
          total_kg: financial.totalKg,
          discount_percent: discountPercent,
          status: 'PENDENTE'
        }])
        .select()
        .single();

      if (transError) throw transError;

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

      alert("Venda realizada com sucesso!");
      setItems([]);
      setCustomer('');
      setDiscountPercent(0);
      inputRef.current?.focus();

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Erro ao salvar: " + message);
    } finally {
      setLoading(false);
    }
  }, [items, customer, financial, discountPercent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10' && items.length > 0 && !loading) {
        e.preventDefault();
        finalizarVenda();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, loading, financial, finalizarVenda]);

  const handleBarcode = (val: string) => {
    setBarcode(val);
    setLastError(null); 

    if (val.length === 13) {
      const parsed = parseScaleBarcode(val);

      if (!parsed) {
        setLastError("Código de barras inválido");
        setBarcode('');
        return;
      }

      const prod = products.find(p => p.id === parsed.productId);

      if (!prod) {
        setLastError(`Produto #${parsed.productId} não encontrado`);
        setBarcode('');
        return;
      }

      setItems(prev => [{
        ...parsed,
        name: prod.name,
        price: prod.price || 0,
        tempId: Date.now(),
        type: prod.type || 'Outros',
      }, ...prev]);

      setBarcode('');
      setLastError(null);
    }
  };

  const categorySummary = useMemo(() => {
    const summary: Record<string, number> = {};

    const grupoPrincipal = ['CARNE', 'ESPECIAL', 'EXTRA'];

    items.forEach(item => {
      const type = (item.type || 'OUTROS').toUpperCase();

      const label = grupoPrincipal.includes(type) ? 'CARNES' : type;

      summary[label] = (summary[label] || 0) + item.weightKg;
    });

    return Object.entries(summary).map(([name, total]) => ({ name, total }));
  }, [items]);

  return (
    <PageLayout>
      <Sidebar>
        <div className={styles.controlTop}>
          <HeaderInput
            titulo="Venda Direta"
            labelDescricao="Identificação do Cliente"
            valor={customer}
            setValor={setCustomer}
            placeholder="Nome + Minuta"
          />

          <div className={`${styles.scannerContainer} ${lastError ? styles.hasError : ''}`}>
            <BarcodeScanner
              ref={inputRef}
              barcode={barcode}
              onChange={handleBarcode}
            />
            {lastError && <span className={styles.errorMsg}>⚠️ {lastError}</span>}
          </div>
        </div>

        <DiscountInput
          key={discountPercent}
          value={discountPercent}
          onApply={(val) => setDiscountPercent(val)}
        />

        <FinancialSummary
          subtotal={financial.subtotal}
          discountVal={financial.discountVal}
          totalFinal={financial.totalFinal}
        />

        <ButtonFinish
          onClick={finalizarVenda}
          loading={loading}
          disabled={items.length === 0}
        />
      </Sidebar>

      <Main>

        {categorySummary.length > 0 && (
          <div className={styles.categoryHeader}>
            {categorySummary.map((cat, idx) => (
              <div
                key={idx}
                className={`${styles.categoryPill} ${cat.name === 'CARNES' ? styles.pillHighlight : ''}`}
              >
                <span className={styles.pillLabel}>{cat.name}</span>
                <span className={styles.pillValue}>{cat.total.toFixed(2)} kg</span>
              </div>
            ))}
          </div>
        )}
        <InventoryCart
          tituloCart="Itens da Venda"
          items={items}
          setItems={setItems}
          totalWeight={financial.totalKg}
          isVenda={true}
        />
      </Main>
    </PageLayout>
  );
}