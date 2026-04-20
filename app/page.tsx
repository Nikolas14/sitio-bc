'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Dashboard() {
  const router = useRouter();

  const atalhos = [
    { title: 'Entrada de Carga', path: '/mov/entrada' },
    { title: 'Caixa / Venda', path: '/mov/venda' },
    { title: 'Estoque Geral', path: '/estoque' },
    { title: 'Estoque Detalhado', path: '/estoque/detalhado' },
    { title: 'Histórico transações', path: '/transacoes' },
    { title: 'Cobrança', path: '/cobranca' },
    { title: 'Nova Projeção', path: '/projecao' },
    { title: 'Lista de Projeção', path: '/projecao/lista' },
    { title: 'Resumo Projeção', path: '/projecao/resumo' },
    { title: 'Saldo Projeção', path: '/projecao/saldo' },
    { title: 'Produtos', path: '/cadastro/produto' },
    
    { title: 'Catálogo de Preços', path: '/lista_preco' },
    { title: 'Envio de avisos', path: '/avisos' },

  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-1">Sistema de Gestão Carnes</p>
        <h1>BEIT CHABAD BELÉM</h1>
      </header>

      {/* GRID DE FUNCIONALIDADES */}
      <div className={styles.menuGrid}>
        {atalhos.map((item, idx) => (
          <div key={idx} className={styles.menuCard} onClick={() => router.push(item.path)}>
            <div>
              <h2 className={styles.cardTitle}>{item.title}</h2>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-20 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Beit Chabad Belém Carnes v2.0 • 2026</p>
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Desenvolvido por Nikolas Ohana</p>
      </footer>
    </div>
  );
}