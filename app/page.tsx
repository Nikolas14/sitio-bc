'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { InventoryList } from '@/components/InventoryList';

export default function HomePage() {
  const router = useRouter();

  const menuItems = [
    {
      title: 'ENTRADA / REPOSIÇÃO',
      desc: 'Abastecer estoque via balança',
      icon: '📥',
      path: '/entrada',
      style: styles.entradaIcon
    },
    {
      title: 'FRENTE DE CAIXA',
      desc: 'Venda rápida e saída de itens',
      icon: '🛒',
      path: '/caixa',
      style: styles.caixaIcon
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {/* Header do Sistema */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">BEIT STOCK PRO</h1>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">Painel de Controle de Inventário</p>
        </div>
        <div className="text-right">
          <span className="block text-[10px] font-black text-slate-400 uppercase">Status do Sistema</span>
          <span className="flex items-center gap-2 text-green-500 font-bold text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
          </span>
        </div>
      </header>

      {/* Grid de Acesso Rápido */}
      <section className={styles.dashboardGrid}>
        {menuItems.map((item) => (
          <div 
            key={item.path} 
            className={styles.card}
            onClick={() => router.push(item.path)}
          >
            <div className={`${styles.iconWrapper} ${item.style}`}>
              {item.icon}
            </div>
            <div className={styles.cardText}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Lista de Estoque */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-200 flex-1"></div>
          <h2 className="text-slate-400 font-black text-xs uppercase tracking-widest">Resumo de Saldo Atual</h2>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>
        
        <InventoryList />
      </section>
    </main>
  );
}