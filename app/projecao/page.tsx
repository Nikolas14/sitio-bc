'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { useProjections } from '@/hooks/useProjections';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import ButtonFinish from '@/components/ButtonFinish/ButtonFinish';
import InventoryCart from '@/components/InventoryCart/InventoryCart';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';

import styles from './page.module.css';
import { ProjectionManualForm } from './components/ProjectionManualForm/ProjectionManualForm';
import CustomerFields from '@/components/CustomerFields/CustomerFields';
import ProjectionPrint, { type PrintData } from './components/ProjectionPrint/ProjectionPrint';
import type { CartItem } from '@/components/InventoryCart/InventoryCart';
import type { ICustomer, IProduct } from '@/types';
import { useToast } from '@/components/Toast/Toast';

export default function ProjecaoEnvioPage() {
  const { products } = useInventory();
  const { refresh } = useProjections();
  const toast = useToast();

  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);

  // A referência é montada sozinha: cliente (principal) + subnome (secundário).
  const finalReference = [customer?.name, identifier.trim()].filter(Boolean).join(' · ') || 'PROJEÇÃO_AVULSA';

  // Cálculos consolidados (Peso e Preço)
  const financial = useMemo(() => {
    const totalKg = items.reduce((acc, item) => acc + item.weightKg, 0);
    const totalPrice = items.reduce((acc, item) => acc + ((item.price || 0) * item.weightKg), 0);
    return { totalKg, totalPrice };
  }, [items]);

  // Produto repetido soma na linha que já existe em vez de duplicar.
  const addItem = (product: IProduct, quantKg: number) => {
    setItems(prev => {
      const existing = prev.find(i => Number(i.productId) === Number(product.id));
      if (existing) {
        return prev.map(i => i.tempId === existing.tempId ? { ...i, weightKg: i.weightKg + quantKg } : i);
      }
      return [{
        productId: product.id,
        name: product.name,
        weightKg: quantKg,
        price: product.price || 0,
        tempId: Date.now()
      }, ...prev];
    });
  };

  const salvarProjecao = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const payload = items.map(item => ({
        product_id: Number(item.productId),
        quant: item.weightKg,
        reference: finalReference,
        customer_id: customer?.id ?? null,
        subname: identifier.trim() || null,
        status: 'ABERTO'
      }));

      const { error } = await supabase.from('ESTOQUE_projection').insert(payload);
      if (error) throw error;

      toast.success("Projeção salva com sucesso!");
      setPrintData({
        reference: finalReference,
        subname: identifier.trim(),
        customer,
        items: items.map(i => ({ name: i.name, weightKg: i.weightKg })),
        date: new Date(),
      });
      setItems([]);
      setCustomer(null);
      setIdentifier('');
      refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error("Erro ao salvar: " + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <Sidebar>
        {/* Conteúdo do Topo */}
        <div className={styles.topContent}>
          <HeaderPadrao titulo="Nova Projeção" />

          <CustomerFields
            customer={customer}
            setCustomer={setCustomer}
            identifier={identifier}
            setIdentifier={setIdentifier}
            resultLabel={finalReference}
          />

          <ProjectionManualForm
            products={products}
            onAdd={addItem}
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
      </Sidebar>

      <Main>
        {printData ? (
          <div className={styles.donePanel}>
            <div className={styles.doneBar}>
              <div>
                <strong>Projeção salva!</strong>
                <span>Confira o pedido abaixo e imprima se precisar.</span>
              </div>
              <div className={styles.doneActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setPrintData(null)}>
                  Nova projeção
                </button>
                <button type="button" className={styles.btnPrint} onClick={() => window.print()}>
                  Imprimir pedido
                </button>
              </div>
            </div>
            <ProjectionPrint data={printData} />
          </div>
        ) : (
          <InventoryCart
            tituloCart="Lista de Conferência da Projeção"
            items={items}
            setItems={setItems}
            totalWeight={financial.totalKg}
            isVenda={true}
          />
        )}
      </Main>
    </PageLayout>
  );
}
