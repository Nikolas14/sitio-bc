'use client';

import { useMemo, useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import styles from './page.module.css';
import GrupoEstoque from './components/GrupoEstoque/GrupoEstoque';
import { useRouter } from 'next/navigation';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import CategoryFilter from './components/CategoryFilter/CategoryFilter';
import HeaderMov from '../../components/HeaderInput/HeaderInput';

export default function EstoqueReportPage() {
  const { products, loading, error, refresh } = useInventory();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const router = useRouter();

  // Agrupamento dos dados
  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {};
    products.forEach((product) => {
      const category = product.type || 'Sem Categoria';
      if (!groups[category]) groups[category] = [];
      groups[category].push({
        id: product.id,
        name: product.name,
        quant: product.current_stock || 0
      });
    });
    return Object.keys(groups).sort().map(cat => ({
      category: cat,
      items: groups[cat]
    }));
  }, [products]);

  const toggleGroup = (cat: string) => {
    setSelectedGroups(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const categories = useMemo(() => groupedData.map(g => g.category), [groupedData]);

  const visibleGroups = useMemo(() => {
    if (selectedGroups.length === 0) return groupedData;
    return groupedData.filter(g => selectedGroups.includes(g.category));
  }, [groupedData, selectedGroups]);

  if (error) return <div className={styles.error}>Erro: {error}</div>;

  return (
    <div className={styles.screen}>
      {/* BARRA LATERAL DE CONTROLE */}
      <aside className={styles.sidebar}>

        <HeaderPadrao titulo='Estoque geral' />       

        <CategoryFilter
          categories={categories}
          selectedGroups={selectedGroups}
          onToggle={toggleGroup}
          onClear={() => setSelectedGroups([])}
        />

        <div className={styles.sideFooter}>
          <button onClick={() => refresh()} className={styles.secondaryBtn}>🔄 Atualizar Dados</button>
        </div>
        
      </aside>

      {/* ÁREA DE CONTEÚDO (ESTOQUE) */}
      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.loading}>Buscando inventário...</div>
        ) : (
          <div className={styles.reportGrid}>
            {visibleGroups.map((group) => (
              <GrupoEstoque
                key={group.category}
                category={group.category}
                list={group.items}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}