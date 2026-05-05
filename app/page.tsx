'use client';

import { useRouter } from 'next/navigation';
import { 
  Package, 
  ShoppingCart, 
  Database, 
  History, 
  FileText, 
  TrendingUp, 
  List, 
  BarChart3, 
  Scale, 
  PlusCircle, 
  Tags 
} from 'lucide-react'; // Instale: npm install lucide-react
import styles from './page.module.css';

export default function Dashboard() {
  const router = useRouter();

  // Categorizamos os atalhos para melhor navegação
  const secoes = [
    {
      nome: 'Movimentação & Vendas',
      itens: [
        { title: 'Caixa / Venda', path: '/mov/venda', icon: <ShoppingCart size={24} />, color: '#22c55e' },
        { title: 'Entrada de Carga', path: '/mov/entrada', icon: <Package size={24} /> },
        { title: 'Histórico', path: '/transacoes', icon: <History size={24} /> },
      ]
    },
    {
      nome: 'Estoque & Cadastro',
      itens: [
        { title: 'Estoque Geral', path: '/estoque', icon: <Database size={24} /> },
        { title: 'Estoque Detalhado', path: '/estoque/detalhado', icon: <List size={24} /> },
        { title: 'Produtos', path: '/cadastro/produto', icon: <PlusCircle size={24} /> },
        { title: 'Catálogo de Preços', path: '/lista_preco', icon: <Tags size={24} /> },
      ]
    },
    {
      nome: 'Financeiro & Projeção',
      itens: [
        { title: 'Cobrança', path: '/cobranca', icon: <FileText size={24} /> },
        { title: 'Nova Projeção', path: '/projecao', icon: <TrendingUp size={24} /> },
        { title: 'Resumo / Saldo', path: '/projecao/saldo', icon: <BarChart3 size={24} /> },
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.systemTag}>Sistema de Gestão Carnes</p>
        <h1 className={styles.title}>BEIT CHABAD BELÉM</h1>
      </header>

      <main className={styles.mainContent}>
        {secoes.map((secao, sIdx) => (
          <div key={sIdx} className={styles.section}>
            <h3 className={styles.sectionTitle}>{secao.nome}</h3>
            <div className={styles.menuGrid}>
              {secao.itens.map((item, idx) => (
                <button 
                  key={idx} 
                  className={styles.menuCard} 
                  onClick={() => router.push(item.path)}
                >
                  <div className={styles.iconWrapper} style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <span className={styles.cardTitle}>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>

      <footer className={styles.footer}>
        <p>Beit Chabad Belém Carnes v2.0 • 2026</p>
        <p>Desenvolvido por Nikolas Ohana</p>
      </footer>
    </div>
  );
}