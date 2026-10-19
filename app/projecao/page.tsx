'use client';

import { useState, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import { useInventory } from '@/hooks/useInventory';
import { useProjections } from '@/hooks/useProjections';
import { useCustomerManager } from '@/hooks/useCustomerManager';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import ButtonFinish from '@/components/ButtonFinish/ButtonFinish';
import InventoryCart from '@/components/InventoryCart/InventoryCart';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';

import styles from './page.module.css';
import { ProjectionManualForm } from './components/ProjectionManualForm/ProjectionManualForm';
import SearchSelect, { normalize } from './components/SearchSelect/SearchSelect';
import ProjectionPrint, { type PrintData } from './components/ProjectionPrint/ProjectionPrint';
import type { CartItem } from '@/components/InventoryCart/InventoryCart';
import type { ICustomer, IProduct } from '@/types';
import { useToast } from '@/components/Toast/Toast';

const matchesCustomer = (c: ICustomer, q: string) =>
  [c.name, c.cpf, c.city].some(value => normalize(value || '').includes(q));

export default function ProjecaoEnvioPage() {
  const { products } = useInventory();
  const { refresh } = useProjections();
  const { customers, loading: customersLoading } = useCustomerManager();
  const toast = useToast();

  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [subname, setSubname] = useState('');
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);

  // A referência é montada sozinha: cliente (principal) + subnome (secundário).
  const finalReference = [customer?.name, subname.trim()].filter(Boolean).join(' · ') || 'PROJEÇÃO_AVULSA';

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
        subname: subname.trim() || null,
        status: 'ABERTO'
      }));

      const { error } = await supabase.from('ESTOQUE_projection').insert(payload);
      if (error) throw error;

      toast.success("Projeção salva com sucesso!");
      setPrintData({
        reference: finalReference,
        subname: subname.trim(),
        customer,
        items: items.map(i => ({ name: i.name, weightKg: i.weightKg })),
        date: new Date(),
      });
      setItems([]);
      setCustomer(null);
      setSubname('');
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

          <div className={styles.customerBlock}>
            <label className={styles.blockLabel}>Cliente</label>
            <SearchSelect
              items={customers}
              selected={customer}
              onSelect={setCustomer}
              matches={matchesCustomer}
              getKey={(c) => c.id}
              getLabel={(c) => c.name}
              renderOption={(c) => (
                <>
                  <span>{c.name}</span>
                  <small>{c.cpf || 'CPF não informado'}{c.city ? ` · ${c.city}` : ''}</small>
                </>
              )}
              placeholder="Buscar cliente por nome, CPF ou cidade..."
              emptyText="Cliente não encontrado"
              loading={customersLoading}
            />

            <label className={styles.blockLabel}>Subnome</label>
            <input
              className={styles.textField}
              type="text"
              value={subname}
              onChange={(e) => setSubname(e.target.value)}
              placeholder="Ex: Sábado, Pedido 2..."
            />
            <span className={styles.refPreview}>Será salvo como: <strong>{finalReference}</strong></span>
          </div>

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
