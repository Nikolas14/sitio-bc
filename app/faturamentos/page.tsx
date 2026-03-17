'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { supabase } from '@/api/supabase';

export default function ListaFaturamentosPage() {
  const router = useRouter();
  const [faturas, setFaturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchFaturas() {
      const { data, error } = await supabase
        .from('faturamento')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setFaturas(data);
      setLoading(false);
    }
    fetchFaturas();
  }, []);

  // Lógica de Filtro em tempo real
  const faturasFiltradas = useMemo(() => {
    return faturas.filter(f => {
      const search = searchTerm.toLowerCase();
      const nomeCliente = (f.customer || '').toLowerCase();
      const serie = String(f.serial_number);
      
      return nomeCliente.includes(search) || serie.includes(search);
    });
  }, [faturas, searchTerm]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ENVIADO': return { bg: '#fef9c3', text: '#854d0e', label: '🟡 Logística: Enviado' };
      case 'COBRADO': return { bg: '#dbeafe', text: '#1e40af', label: '🔵 Financeiro: Cobrado' };
      case 'FINALIZADO': return { bg: '#dcfce7', text: '#166534', label: '🟢 Venda Finalizada' };
      default: return { bg: '#f1f5f9', text: '#475569', label: status };
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 italic">CONTROLO DE VENDAS</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Gestão de Faturamento</p>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className="relative w-full md:w-96">
          <span className="absolute left-4 top-3.5 opacity-30">🔍</span>
          <input 
            type="text"
            placeholder="Procurar por cliente ou nº de série..."
            className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button onClick={() => router.push('/')} className="text-slate-500 font-bold hover:underline hidden md:block">
          ← Voltar
        </button>
      </header>

      {loading ? (
        <div className="text-center py-20 font-bold text-slate-300 animate-pulse">A carregar processos...</div>
      ) : (
        <div className="grid gap-4">
          {faturasFiltradas.map((f) => {
            const style = getStatusStyle(f.status);
            return (
              <div 
                key={f.id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/faturamento/${f.id}`)}
              >
                <div className="flex items-center gap-6">
                  {/* Badge do Número de Série */}
                  <div className="bg-slate-900 text-white w-14 h-14 rounded-xl flex flex-col items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <span className="text-[8px] font-bold opacity-50 uppercase">Série</span>
                    <span className="text-lg font-black">{f.serial_number}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase leading-none mb-1">
                      {f.customer || 'Consumidor Final'}
                    </h3>
                    <div className="flex gap-4">
                      <span className="text-[11px] font-bold text-slate-400">⚖️ {f.total_kg?.toFixed(3)} KG</span>
                      <span className="text-[11px] font-bold text-slate-400">📅 {new Date(f.created_at).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <span className="block text-[9px] font-black text-slate-300 uppercase">Total Estimado</span>
                    <span className="text-lg font-black text-slate-700">
                      R$ {(f.total_final || f.priceTotal)?.toFixed(2)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div 
                    className="min-w-[140px] text-center py-2 rounded-xl text-[10px] font-black uppercase tracking-tight"
                    style={{ backgroundColor: style.bg, color: style.text }}
                  >
                    {style.label}
                  </div>
                  
                  <span className="text-slate-300 group-hover:translate-x-1 transition-transform">❯</span>
                </div>
              </div>
            );
          })}

          {/* Estado Vazio */}
          {faturasFiltradas.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">Nenhum resultado para "{searchTerm}"</p>
              <button onClick={() => setSearchTerm('')} className="text-blue-500 font-bold text-xs mt-2 underline">Limpar busca</button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}