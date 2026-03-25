'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/api/supabase';
import styles from './page.module.css';

const STATUS_LIST = ['TODOS', 'PENDENTE', 'COBRADO', 'ENVIADO', 'CONCLUIDO', 'CANCELADO'];

export default function ListaCobrancasPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('TODOS');

  useEffect(() => {
    async function fetchCobrancas() {
      setLoading(true);
      const { data, error } = await supabase
        .from('ESTOQUE_transaction')
        .select('*')
        .eq('type', 'OUT') // Somente vendas/saídas
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setTransactions(data || []);
      setLoading(false);
    }
    fetchCobrancas();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (filter === 'TODOS') return transactions;
    return transactions.filter(t => t.status === filter);
  }, [transactions, filter]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-slate-800 uppercase">Gestão de Cobranças</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Controle de Saídas e Pagamentos</p>
        </div>
        <button onClick={() => router.push('/')} className="text-xs font-black text-blue-500 uppercase hover:underline">
          Painel Principal
        </button>
      </header>

      {/* BARRA DE FILTROS */}
      <div className={styles.filterBar}>
        {STATUS_LIST.map(s => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* TABELA DE COBRANÇAS */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Série</th>
            <th>Cliente</th>
            <th>Data</th>
            <th>Total Bruto</th>
            <th>Status</th>
            <th className="text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={6} className="text-center p-20 font-black text-slate-200 animate-pulse">CARREGANDO DADOS...</td></tr>
          ) : filteredTransactions.map(t => (
            <tr key={t.id}>
              <td className="font-mono font-bold text-slate-400 text-xs">#{t.serial_number}</td>
              <td className="font-bold uppercase text-slate-700">{t.customer_vendor}</td>
              <td className="text-slate-500 text-xs">
                {new Date(t.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td className="font-black text-slate-900">
                R$ {Number(t.total_price).toFixed(2)}
              </td>
              <td>
                <span className={`${styles.statusBadge} ${styles['status' + (t.status || 'PENDENTE')]}`}>
                  {t.status || 'PENDENTE'}
                </span>
              </td>
              <td className="text-right">
                <button 
                  className={styles.actionBtn}
                  onClick={() => router.push(`/cobranca/${t.id}`)}
                >
                  ⚙️ Gerenciar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && filteredTransactions.length === 0 && (
        <div className="p-20 text-center text-slate-300 font-bold italic">
          Nenhuma transação encontrada para este filtro.
        </div>
      )}
    </div>
  );
}