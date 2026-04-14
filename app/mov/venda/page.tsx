'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { parseScaleBarcode } from '@/utils/barcodeParser';

import BarcodeScanner from '../../../components/BarcodeScanner/BarcodeScanner';
import InventoryCart from '../../../components/InventoryCart/InventoryCart';
import ButtonFinish from '../../../components/ButtonFinish/ButtonFinish';
import FinancialSummary from '../components/FinancialSummary/FinancialSummary';
import DiscountInput from '../../../components/DiscountInput/DiscountInput';
import HeaderInput from '@/components/HeaderInput/HeaderInput';

import styles from './page.module.css';

export default function VendaSimplificadaPage() {
  const { products } = useInventory();

  const [customer, setCustomer] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Cálculos Financeiros
  const financial = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.weightKg), 0);
    const totalKg = items.reduce((acc, item) => acc + item.weightKg, 0);
    const discountVal = subtotal * (discountPercent / 100);
    const totalFinal = subtotal - discountVal;

    return { subtotal, totalKg, discountVal, totalFinal };
  }, [items, discountPercent]);

  // Atalho F10 para finalizar
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

  // Função para feedback sonoro de erro
  const playErrorSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(() => { });
  };

  const handleBarcode = (val: string) => {
    setBarcode(val);
    setLastError(null); // Limpa erro anterior ao digitar

    if (val.length === 13) {
      const parsed = parseScaleBarcode(val);

      // Camada de Segurança 1: Código de barras é reconhecível?
      if (!parsed) {
        setLastError("Código de barras inválido");
        playErrorSound();
        setBarcode('');
        return;
      }

      const prod = products.find(p => p.id === parsed.productId);

      // Camada de Segurança 2: Produto existe no cadastro?
      if (!prod) {
        setLastError(`Produto #${parsed.productId} não encontrado`);
        playErrorSound();
        setBarcode('');
        return;
      }

      // Sucesso: Adiciona ao carrinho
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

    // Definimos quais tipos devem ser somados juntos
    const grupoPrincipal = ['CARNE', 'ESPECIAL', 'EXTRA'];

    items.forEach(item => {
      // Normalizamos para maiúsculo para evitar erro de digitação
      const type = (item.type || 'OUTROS').toUpperCase();

      // Se o tipo estiver na lista, agrupamos em "CARNES" (ou o nome que preferir)
      const label = grupoPrincipal.includes(type) ? 'CARNES' : type;

      summary[label] = (summary[label] || 0) + item.weightKg;
    });

    return Object.entries(summary).map(([name, total]) => ({ name, total }));
  }, [items]);

  const finalizarVenda = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      // 1. Criar Cabeçalho (Transaction)
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

      // 2. Criar Itens (Operations)
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

    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <aside className={styles.leftPanel}>
        <div className={styles.controlTop}>
          <HeaderInput
            titulo="Venda Direta"
            labelDescricao="Identificação do Cliente"
            valor={customer}
            setValor={setCustomer}
            placeholder="Nome ou CPF..."
          />

          {/* Wrapper com estado de erro visual */}
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
      </aside>

      <main className={styles.cartWrapper}>

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
      </main>
    </div>
  );
}