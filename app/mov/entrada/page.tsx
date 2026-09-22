'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { parseScaleBarcode } from '@/utils/barcodeParser';
import type { CartItem } from '../../../components/InventoryCart/InventoryCart';

import BarcodeScanner from '../../../components/BarcodeScanner/BarcodeScanner';
import InventoryCart from '../../../components/InventoryCart/InventoryCart';
import ButtonFinish from '../../../components/ButtonFinish/ButtonFinish';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';

import styles from './page.module.css';

export default function EntradaSimplificadaPage() {
  const { products } = useInventory();

  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const financial = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + ((item.price || 0) * item.weightKg), 0);
    const totalKg = items.reduce((acc, item) => acc + item.weightKg, 0);
    return { subtotal, totalKg, totalFinal: subtotal };
  }, [items]);

  const finalizarEntrada = useCallback(async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const { data: trans, error: transError } = await supabase
        .from('ESTOQUE_transaction')
        .insert([{
          type: 'IN',
          customer_vendor: customer || 'ENTRADA_AVULSA',
          total_price: financial.totalFinal,
          total_kg: financial.totalKg,
          discount_percent: 0,
          status: 'ENTRADA'
        }])
        .select()
        .single();

      if (transError) throw transError;

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

      alert("Entrada enviada com sucesso!");
      setItems([]);
      setCustomer('');
      inputRef.current?.focus();

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Erro ao salvar Entrada: " + message);
    } finally {
      setLoading(false);
    }
  }, [items, customer, financial]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10' && items.length > 0 && !loading) {
        e.preventDefault();
        finalizarEntrada();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, loading, finalizarEntrada]);

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

      // Camada de Segurança 2: Produto existe no banco?
      if (!prod) {
        setLastError(`Produto #${parsed.productId} não cadastrado`);
        setBarcode('');
        return;
      }

      // Sucesso: Adiciona o item à lista de conferência
      setItems(prev => [{
        ...parsed,
        name: prod.name,
        price: prod.price || 0,
        tempId: Date.now()
      }, ...prev]);
      
      setBarcode('');
      setLastError(null);
    }
  };

  return (
    <PageLayout>
      <Sidebar>
        <div className={styles.controlTop}>
          <HeaderInput
            titulo="Entrada de Estoque"
            labelDescricao="Referência / Abate"
            valor={customer}
            setValor={setCustomer}
            placeholder="Ex: 50 Bois / 600 frangos"
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

        <div className={styles.summaryMinimal}>
          <span className={styles.label}>Peso Total Identificado</span>
          <div className={styles.weightValue}>{financial.totalKg.toFixed(2)} KG</div>
        </div>

        <ButtonFinish
          onClick={finalizarEntrada}
          loading={loading}
          disabled={items.length === 0}
        />
      </Sidebar>

      <Main>
        <InventoryCart
          tituloCart="Conferência"
          items={items}
          setItems={setItems}
          totalWeight={financial.totalKg}
          isVenda={false}
        />
      </Main>
    </PageLayout>
  );
}