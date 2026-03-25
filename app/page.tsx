'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { supabase } from '@/api/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ aReceber: 0, pendentes: 0, vendasHoje: 0 });

  useEffect(() => {
    async function fetchDashboardStats() {
      const hoje = new Date();
      hoje.setHours(0,0,0,0);

      const { data: transacoes } = await supabase
        .from('ESTOQUE_transaction')
        .select('total_price, discount_percent, shipping_cost, tax_amount, paid_amount, status, created_at')
        .eq('type', 'OUT');

      if (transacoes) {
        let totalAReceber = 0;
        let countPendentes = 0;
        let countVendasHoje = 0;

        transacoes.forEach(t => {
          // Cálculo do valor final da transação
          const sub = Number(t.total_price);
          const desc = sub * (Number(t.discount_percent) / 100);
          const final = (sub - desc) + Number(t.shipping_cost) + Number(t.tax_amount);
          
          // Soma o que falta pagar (Saldo Devedor)
          if (t.status !== 'CONCLUIDO' && t.status !== 'CANCELADO') {
            totalAReceber += (final - Number(t.paid_amount));
            countPendentes++;
          }

          // Vendas de hoje
          if (new Date(t.created_at) >= hoje) {
            countVendasHoje++;
          }
        });

        setStats({ aReceber: totalAReceber, pendentes: countPendentes, vendasHoje: countVendasHoje });
      }
    }
    fetchDashboardStats();
  }, []);

  const atalhos = [
    { title: 'Entrada de Carga', desc: 'Registrar chegada de mercadoria', icon: '📥', path: '/entrada' },
    { title: 'Caixa / Venda', desc: 'Bipar produtos e criar pedido', icon: '🛒', path: '/venda' },
    { title: 'Gestão de Cobranças', desc: 'Status, fretes e pagamentos', icon: '💰', path: '/cobranca' },
    { title: 'Estoque Detalhado', desc: 'Saldos e extratos por produto', icon: '📋', path: '/detalhes' },
    { title: 'Histórico Geral', desc: 'Auditoria de todas transações', icon: '📜', path: '/transacoes' },
    { title: 'Produtos', desc: 'Cadastrar e editar preços', icon: '📦', path: '/produtos' },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-1">Sistema de Gestão</p>
        <h1>BEIT STOCK</h1>
      </header>

      {/* GRID DE FUNCIONALIDADES */}
      <div className={styles.menuGrid}>
        {atalhos.map((item, idx) => (
          <div key={idx} className={styles.menuCard} onClick={() => router.push(item.path)}>
            <div>
              <div className={styles.cardIcon}>{item.icon}</div>
              <h2 className={styles.cardTitle}>{item.title}</h2>
              <p className={styles.cardDesc}>{item.desc}</p>
            </div>
            <div className="text-right">
              <span className="text-blue-500 font-black text-xl">→</span>
            </div>
          </div>
        ))}
      </div>

      {/* RESUMO FINANCEIRO */}
      <div className={styles.statsRow}>
        <div className={styles.statBox} style={{ borderLeft: '8px solid #ef4444' }}>
          <span className={styles.statLabel}>Total a Receber</span>
          <span className={styles.statValue}>R$ {stats.aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span className={styles.statSub}>{stats.pendentes} cobranças aguardando acerto</span>
        </div>

        <div className={styles.statBox} style={{ borderLeft: '8px solid #22c55e' }}>
          <span className={styles.statLabel}>Movimentação de Hoje</span>
          <span className={styles.statValue}>{stats.vendasHoje} Pedidos</span>
          <span className={styles.statSub}>Vendas registradas nas últimas 24h</span>
        </div>
      </div>

      <footer className="mt-20 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Beit Stock v2.0 • 2026</p>
      </footer>
    </div>
  );
}