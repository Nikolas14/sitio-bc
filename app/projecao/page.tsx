'use client';

import { useState, useRef, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { useProjections } from '@/hooks/useProjections';

import HeaderInput from '@/components/HeaderInput/HeaderInput';
import ButtonFinish from '@/components/ButtonFinish/ButtonFinish';
import InventoryCart from '@/components/InventoryCart/InventoryCart';

import styles from './page.module.css';
import { ProjectionManualForm } from './components/ProjectionManualForm/ProjectionManualForm';

export default function ProjecaoEnvioPage() {
  const { products } = useInventory();
  const { refresh } = useProjections();

  const [reference, setReference] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState('');
  const [manualQuant, setManualQuant] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);

  const idInputRef = useRef<HTMLInputElement>(null);

  // Preview do produto em tempo real
  const previewProduct = useMemo(() => {
    if (!manualId) return null;
    return products.find(p => Number(p.id) === Number(manualId));
  }, [manualId, products]);

  // Cálculos consolidados (Peso e Preço)
  const financial = useMemo(() => {
    const totalKg = items.reduce((acc, item) => acc + item.weightKg, 0);
    const totalPrice = items.reduce((acc, item) => acc + (item.price * item.weightKg), 0);
    return { totalKg, totalPrice };
  }, [items]);

  const addManualItem = () => {
    setLastError(null);
    if (!manualId || !manualQuant) {
      setLastError("Preencha ID e Quantidade");
      return;
    }
    if (!previewProduct) {
      setLastError(`ID #${manualId} não localizado`);
      return;
    }

    setItems(prev => [{
      productId: previewProduct.id,
      name: previewProduct.name,
      weightKg: Number(manualQuant),
      price: previewProduct.price || 0,
      tempId: Date.now()
    }, ...prev]);

    setManualId('');
    setManualQuant('');
    idInputRef.current?.focus();
  };

  const salvarProjecao = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const payload = items.map(item => ({
        product_id: Number(item.productId),
        quant: item.weightKg,
        reference: reference || 'PROJEÇÃO_AVULSA',
        status: 'ABERTO'
      }));

      const { error } = await supabase.from('ESTOQUE_projection').insert(payload);
      if (error) throw error;

      alert("Projeção salva com sucesso!");
      setItems([]);
      setReference('');
      refresh();
      idInputRef.current?.focus();
    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <aside className={styles.leftPanel}>
        {/* Conteúdo do Topo */}
        <div className={styles.topContent}>
          <HeaderInput
            titulo="Nova Projeção"
            labelDescricao="Referência da Carga"
            valor={reference}
            setValor={setReference}
            placeholder="Ex: Envio para Matriz"
          />

          <ProjectionManualForm
            ref={idInputRef}
            manualId={manualId}
            setManualId={setManualId}
            manualQuant={manualQuant}
            setManualQuant={setManualQuant}
            previewProduct={previewProduct}
            addManualItem={addManualItem}
            lastError={lastError}
            totalKg={financial.totalKg}
            totalPrice={financial.totalPrice}
          />
        </div>

        {/* Este container vai "sugar" o espaço e empurrar o botão para o fim */}
        <div className={styles.footerActions}>
          <ButtonFinish
            onClick={salvarProjecao}
            loading={loading}
            disabled={items.length === 0}
          />
        </div>
      </aside>

      <main className={styles.cartWrapper}>
        <InventoryCart
          tituloCart="Lista de Conferência da Projeção"
          items={items}
          setItems={setItems}
          totalWeight={financial.totalKg}
          isVenda={true}
        />
      </main>
    </div>
  );
}