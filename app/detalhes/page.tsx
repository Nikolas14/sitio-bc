'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/api/supabase';

type Period = 'yesterday' | '3d' | '7d' | '30d' | 'all';

export default function DetalhesPage() {
  const router = useRouter();
  const { products, loading } = useInventory();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [period, setPeriod] = useState<Period>('30d');

  const filteredList = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  useEffect(() => {
    if (!selectedId) return;

    async function fetchHistory() {
      setHistoryLoading(true);
      
      let query = supabase
        .from('operation_new')
        .select('*')
        .eq('product_id', selectedId)
        .order('date', { ascending: false });

      if (period !== 'all') {
        const dateLimit = new Date();
        
        if (period === 'yesterday') {
          // Ontem às 00:00:00
          dateLimit.setDate(dateLimit.getDate() - 1);
          dateLimit.setHours(0, 0, 0, 0);
        } else {
          const days = period === '3d' ? 3 : period === '7d' ? 7 : 30;
          dateLimit.setDate(dateLimit.getDate() - days);
        }
        
        query = query.gte('date', dateLimit.toISOString());
      }

      const { data } = await query;
      setHistory(data || []);
      setHistoryLoading(false);
    }
    fetchHistory();
  }, [selectedId, period]);

  const selectedProduct = products.find(p => p.id === selectedId);

  // Soma de pesos do período para o resumo
  const totals = useMemo(() => {
    return history.reduce((acc, curr) => {
      if (curr.type === 'IN') acc.in += curr.quant;
      else acc.out += curr.quant;
      return acc;
    }, { in: 0, out: 0 });
  }, [history]);

  return (
    <div className={styles.screen}>
      {/* ESQUERDA: LISTA */}
      <aside className={styles.leftPanel}>
        <div className="p-5 border-b bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-black italic text-xl tracking-tighter">DETALHES</h1>
            <button onClick={() => router.push('/')} className="text-[10px] font-black text-blue-500 uppercase">Voltar</button>
          </div>
          <input 
            className="w-full p-2.5 bg-slate-100 rounded-xl text-sm outline-none border border-transparent focus:border-blue-400"
            placeholder="Procurar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.scrollArea}>
          {loading ? <p className="p-10 text-center text-xs">A carregar...</p> : 
            filteredList.map(p => (
              <div 
                key={p.id} 
                className={`${styles.compactRow} ${selectedId === p.id ? styles.activeRow : ''}`}
                onClick={() => setSelectedId(p.id)}
              >
                <div>
                  <p className="text-[9px] font-black text-slate-300">ID {p.id}</p>
                  <p className="font-bold text-xs uppercase text-slate-700">{p.name}</p>
                </div>
                <p className={`font-black text-sm ${Number(p.current_stock) > 0 ? 'text-green-500' : 'text-slate-300'}`}>
                  {Number(p.current_stock).toFixed(2)}
                </p>
              </div>
            ))
          }
        </div>
      </aside>

      {/* DIREITA: DETALHES */}
      <main className={styles.rightPanel}>
        {selectedProduct ? (
          <div className={styles.detailCard}>
            <header className="flex justify-between items-start border-b pb-8 mb-8">
              <div>
                <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded font-black text-[9px] uppercase mb-2 inline-block">
                  {selectedProduct.type || 'GERAL'}
                </span>
                <h2 className="text-5xl font-black text-slate-900 uppercase leading-none">{selectedProduct.name}</h2>
                <div className="flex gap-4 mt-2">
                   <p className="text-green-600 font-bold text-xs">Entradas: +{totals.in.toFixed(2)}kg</p>
                   <p className="text-red-500 font-bold text-xs">Saídas: -{totals.out.toFixed(2)}kg</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-5">
                <button onClick={() => window.print()} className={styles.printExtractBtn}>
                  🖨️ IMPRIMIR EXTRATO
                </button>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Atual</p>
                  <p className="text-6xl font-black text-slate-900">
                    {Number(selectedProduct.current_stock).toFixed(3)}
                    <span className="text-xl ml-1 text-slate-300">KG</span>
                  </p>
                </div>
              </div>
            </header>

            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 tracking-tight text-lg underline decoration-blue-500 underline-offset-8">
                HISTÓRICO DE OPERAÇÕES
              </h3>
              
              <div className={styles.periodToggle}>
                {(['yesterday', '3d', '7d', '30d', 'all'] as Period[]).map((p) => (
                  <button 
                    key={p}
                    className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ''}`}
                    onClick={() => setPeriod(p)}
                  >
                    {p === 'yesterday' ? 'ONTEM' : p === '3d' ? '3D' : p === '7d' ? '7D' : p === '30d' ? '30D' : 'TUDO'}
                  </button>
                ))}
              </div>
            </div>

            {historyLoading ? (
              <div className="p-20 text-center font-black text-slate-200 text-2xl animate-pulse">A BUSCAR HISTÓRICO...</div>
            ) : (
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Tipo</th>
                    <th>Qtd (KG)</th>
                    <th>Origem / Destino</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td className="font-mono text-slate-500 text-xs">{new Date(h.date).toLocaleString('pt-PT')}</td>
                      <td>
                        <span className={h.type === 'IN' ? styles.badgeIn : styles.badgeOut}>
                          {h.type === 'IN' ? '▲ ENTRADA' : '▼ SAÍDA'}
                        </span>
                      </td>
                      <td className="font-black text-slate-800">{h.quant.toFixed(3)}</td>
                      <td className="text-slate-400 font-medium uppercase text-[11px]">{h.customer || 'Ajuste Interno'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-200 font-black flex-col">
            <p className="tracking-widest text-[10px] uppercase">Selecione um produto para começar</p>
          </div>
        )}
      </main>
    </div>
  );
}