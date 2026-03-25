'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { supabase } from '@/api/supabase';

export default function TransacoesInterface() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Buscar Transações
  useEffect(() => {
    async function fetchTrans() {
      const { data } = await supabase
        .from('ESTOQUE_transaction')
        .select('*')
        .order('created_at', { ascending: false });
      setTransactions(data || []);
      setLoading(false);
    }
    fetchTrans();
  }, []);

  // 2. Buscar Itens da Transação Selecionada (Incluindo o preço do produto)
  useEffect(() => {
    if (!selectedId) return;
    async function fetchItems() {
      const { data } = await supabase
        .from('ESTOQUE_operation')
        // Buscamos o nome e o preço do produto relacionado
        .select(`*, ESTOQUE_product(name, price)`)
        .eq('transaction_id', selectedId);
      setItems(data || []);
    }
    fetchItems();
  }, [selectedId]);

  const active = transactions.find(t => t.id === selectedId);

  // 3. Cálculos Financeiros
  const financial = useMemo(() => {
    if (!active) return null;
    const subtotal = Number(active.total_price);
    const discountVal = subtotal * (Number(active.discount_percent) / 100);
    const taxVal = Number(active.tax_amount) || 0;
    const finalTotal = (subtotal - discountVal) + taxVal + Number(active.shipping_cost);

    return { subtotal, discountVal, taxVal, finalTotal };
  }, [active]);

  return (
    <div className={styles.screen}>
      {/* PAINEL ESQUERDO: LISTA */}
      <aside className={styles.leftPanel}>
        <div className={styles.filterHeader}>
          <h1 className="text-xl font-black italic tracking-tighter">HISTÓRICO</h1>
          <button onClick={() => router.push('/')} className="text-[10px] font-black text-blue-500 uppercase mt-2">Voltar</button>
        </div>

        <div className={styles.scrollArea}>
          {loading ? <p className="p-10 text-center text-xs">Carregando...</p> : 
            transactions.map(t => (
              <div 
                key={t.id} 
                className={`${styles.transCard} ${selectedId === t.id ? styles.activeCard : ''}`}
                onClick={() => setSelectedId(t.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-black text-slate-300">#{t.serial_number}</span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded ${t.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                  </span>
                </div>
                <p className="font-bold text-xs uppercase text-slate-700 truncate">{t.customer_vendor}</p>
                <div className="flex justify-between mt-2 items-center">
                  <span className="text-[10px] text-slate-400 font-bold">{new Date(t.created_at).toLocaleDateString()}</span>
                  <span className="font-black text-sm text-slate-900">R$ {Number(t.total_price).toFixed(2)}</span>
                </div>
              </div>
            ))
          }
        </div>
      </aside>

      {/* PAINEL DIREITO: DETALHES */}
      <main className={styles.rightPanel}>
        {active && financial ? (
          <div className={styles.receipt}>
            <header className="flex justify-between items-start mb-8 border-b pb-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhe da Transação</p>
                <h2 className="text-4xl font-black text-slate-800 uppercase leading-none tracking-tighter">{active.customer_vendor}</h2>
                <p className="text-slate-400 font-bold text-sm italic mt-2">Série: #{active.serial_number} • {new Date(active.created_at).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso da Carga</p>
                <p className="text-4xl font-black text-slate-900 leading-none">{Number(active.total_kg).toFixed(3)} <span className="text-sm">KG</span></p>
              </div>
            </header>

            <table className={styles.itemTable}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="text-center">Preço/KG</th>
                  <th className="text-center">Qtd (KG)</th>
                  <th className="text-right">Total Item</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const unitPrice = Number(item.ESTOQUE_product?.price || 0);
                  const itemTotal = Number(item.quant) * unitPrice;
                  
                  return (
                    <tr key={idx}>
                      <td className="font-bold uppercase text-slate-700">{item.ESTOQUE_product?.name}</td>
                      <td className="text-center text-slate-400 font-bold">R$ {unitPrice.toFixed(2)}</td>
                      <td className="text-center font-black text-slate-900">{Number(item.quant).toFixed(3)}</td>
                      <td className="text-right font-black text-slate-700">R$ {itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* RESUMO FINANCEIRO */}
            <div className={styles.financeGrid}>
              <div /> {/* Espaçador */}
              <div>
                <div className={styles.financeLine}>
                  <span>Subtotal:</span>
                  <span>R$ {financial.subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.financeLine}>
                  <span>Desconto ({active.discount_percent}%):</span>
                  <span className="text-red-500">- R$ {financial.discountVal.toFixed(2)}</span>
                </div>
                {active.tax_amount > 0 && (
                  <div className={styles.financeLine}>
                    <span>Imposto (10%):</span>
                    <span>+ R$ {financial.taxVal.toFixed(2)}</span>
                  </div>
                )}
                {active.shipping_cost > 0 && (
                  <div className={styles.financeLine}>
                    <span>Frete:</span>
                    <span>+ R$ {Number(active.shipping_cost).toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.totalLine}>
                  <span>TOTAL:</span>
                  <span>R$ {financial.finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-200 font-black uppercase tracking-widest text-xs">
            Selecione uma transação ao lado para ver os detalhes
          </div>
        )}
      </main>
    </div>
  );
}