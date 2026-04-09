'use client';

import { useState, useRef, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import HeaderInput from '@/components/HeaderInput/HeaderInput';
import ButtonFinish from '@/components/ButtonFinish/ButtonFinish';
import InventoryCart from '@/components/InventoryCart/InventoryCart';

import styles from './page.module.css';

export default function ProjecaoEnvioPage() {
  const { products } = useInventory();

  // Estados principais
  const [reference, setReference] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados de entrada manual
  const [manualId, setManualId] = useState('');
  const [manualQuant, setManualQuant] = useState('');
  const [lastError, setLastError] = useState<string | null>(null);

  const idInputRef = useRef<HTMLInputElement>(null);

  // 1. PREVIEW EM TEMPO REAL: Busca o produto enquanto o ID é digitado
  const previewProduct = useMemo(() => {
    if (!manualId) return null;
    // Compara convertendo ambos para Number para evitar erro de tipo
    return products.find(p => Number(p.id) === Number(manualId));
  }, [manualId, products]);

  // Cálculo de peso total
  const totalKg = useMemo(() => {
    return items.reduce((acc, item) => acc + item.weightKg, 0);
  }, [items]);

  // Função para adicionar item à lista temporária
  const addManualItem = () => {
    setLastError(null);

    if (!manualId || !manualQuant) {
      setLastError("Informe ID e Quantidade");
      return;
    }

    if (!previewProduct) {
      setLastError(`Produto #${manualId} não existe`);
      return;
    }

    // Adiciona o item (usando os dados do previewProduct encontrado)
    setItems(prev => [{
      productId: previewProduct.id,
      name: previewProduct.name,
      weightKg: Number(manualQuant),
      price: previewProduct.price || 0,
      tempId: Date.now()
    }, ...prev]);

    // Limpa campos e foca no ID para o próximo
    setManualId('');
    setManualQuant('');
    idInputRef.current?.focus();
  };

  // Salva no banco de dados (Tabela ESTOQUE_projection)
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

      const { error } = await supabase
        .from('ESTOQUE_projection')
        .insert(payload);

      if (error) throw error;

      alert("Projeção de envio salva com sucesso!");
      setItems([]);
      setReference('');
      idInputRef.current?.focus();

    } catch (err: any) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      
      {/* BARRA LATERAL (CONTROLES) */}
      <aside className={styles.leftPanel}>
        <div className={styles.controlTop}>
          <HeaderInput
            titulo="Nova Projeção"
            labelDescricao="Referência da Carga"
            valor={reference}
            setValor={setReference}
            placeholder="Ex: Envio para Matriz"
          />

          <div className={styles.manualInputGrid}>
            <div className={styles.inputField}>
              <label className={styles.miniLabel}>ID Produto</label>
              <input
                ref={idInputRef}
                className={`${styles.field} ${previewProduct ? styles.inputSuccess : ''}`}
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && document.getElementById('qInput')?.focus()}
                placeholder="ID"
              />
              
              {/* FEEDBACK DE IDENTIFICAÇÃO */}
              <div className={styles.previewArea}>
                {previewProduct ? (
                  <span className={styles.foundText}>✅ {previewProduct.name}</span>
                ) : manualId ? (
                  <span className={styles.errorText}>❌ Não encontrado</span>
                ) : (
                  <span className={styles.idleText}>Aguardando ID...</span>
                )}
              </div>
            </div>

            <div className={styles.inputField}>
              <label className={styles.miniLabel}>Qtd (KG)</label>
              <input
                id="qInput"
                className={styles.field}
                type="number"
                value={manualQuant}
                onChange={(e) => setManualQuant(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addManualItem()}
                placeholder="0.00"
              />
            </div>
          </div>

          <button className={styles.btnAdd} onClick={addManualItem}>
            Incluir na Lista
          </button>

          {lastError && <span className={styles.alertMsg}>⚠️ {lastError}</span>}
        </div>

        <div className={styles.summaryBox}>
          <span className={styles.label}>Peso Total Projetado</span>
          <div className={styles.weightValue}>{totalKg.toFixed(2)} KG</div>
        </div>

        <ButtonFinish
          onClick={salvarProjecao}
          loading={loading}
          disabled={items.length === 0}
        />
      </aside>

      {/* ÁREA PRINCIPAL (CARRINHO) */}
      <main className={styles.cartWrapper}>
        <InventoryCart
          tituloCart="Lista de Conferência da Projeção"
          items={items}
          setItems={setItems}
          totalWeight={totalKg}
          isVenda={false}
        />
      </main>

    </div>
  );
}