'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { parseScaleBarcode } from '@/utils/barcodeParser';

import BarcodeScanner from '../../../components/BarcodeScanner/BarcodeScanner';
import InventoryCart from '../../../components/InventoryCart/InventoryCart';
import ButtonFinish from '../../../components/ButtonFinish/ButtonFinish';
import HeaderInput from '@/components/HeaderInput/HeaderInput';

import styles from './page.module.css';

export default function EntradaSimplificadaPage() {
  const { products } = useInventory();

  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null); // Estado de erro

  const inputRef = useRef<HTMLInputElement>(null);

  // Cálculos Financeiros (Simplificados para Entrada)
  const financial = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.weightKg), 0);
    const totalKg = items.reduce((acc, item) => acc + item.weightKg, 0);
    return { subtotal, totalKg, totalFinal: subtotal };
  }, [items]);

  // Atalho F10
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10' && items.length > 0 && !loading) {
        e.preventDefault();
        finalizarEntrada();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, loading]);

  // Função de Alarme Sonoro
  const playErrorSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(() => {}); 
  };

  const handleBarcode = (val: string) => {
    setBarcode(val);
    setLastError(null); // Limpa erro ao começar novo bip

    if (val.length === 13) {
      const parsed = parseScaleBarcode(val);
      
      // Camada de Segurança 1: Formato do código
      if (!parsed) {
        setLastError("Código de barras inválido");
        playErrorSound();
        setBarcode('');
        return;
      }

      const prod = products.find(p => p.id === parsed.productId);

      // Camada de Segurança 2: Produto existe no banco?
      if (!prod) {
        setLastError(`Produto #${parsed.productId} não cadastrado`);
        playErrorSound();
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

  const finalizarEntrada = async () => {
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

    } catch (err: any) {
      alert("Erro ao salvar Entrada: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <aside className={styles.leftPanel}>
        <div className={styles.controlTop}>
          <HeaderInput
            titulo="Entrada de Estoque"
            labelDescricao="Referência / Abate"
            valor={customer}
            setValor={setCustomer}
            placeholder="Ex: 50 Bois / Lote 402"
          />

          {/* Camada Visual de Erro */}
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
      </aside>

      <main className={styles.cartWrapper}>
        <InventoryCart
          tituloCart="Conferência de Carga"
          items={items}
          setItems={setItems}
          totalWeight={financial.totalKg}
          isVenda={false} 
        />
      </main>
    </div>
  );
}