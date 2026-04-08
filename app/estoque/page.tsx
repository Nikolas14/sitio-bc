'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';
import GrupoEstoque from './components/GrupoEstoque/GrupoEstoque';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import CategoryFilter from './components/CategoryFilter/CategoryFilter';
import { useInventory } from '@/hooks/useInventory';

export default function EstoqueReportPage() {
  const { products, loading, error, refresh } = useInventory();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Agrupamento dos dados corrigido
  const groupedData = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    // USAR 'products' que vem do hook, não 'inventory'
    products.forEach((item) => {
      // Como é uma View, os campos estão na raiz do objeto (item.type, item.name, etc)
      const category = item.type || 'Sem Categoria';
      
      if (!groups[category]) groups[category] = [];
      
      groups[category].push({
        id: item.id,
        name: item.name,
        current_stock: Number(item.current_stock) || 0 
      });
    });

    return Object.keys(groups).sort().map(cat => ({
      category: cat,
      items: groups[cat]
    }));
  }, [products]); // Dependência corrigida para 'products'

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

      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.loading}>Buscando inventário...</div>
        ) : (
          <div className={styles.reportGrid}>
            {visibleGroups.length > 0 ? (
              visibleGroups.map((group) => (
                <GrupoEstoque
                  key={group.category}
                  category={group.category}
                  list={group.items}
                />
              ))
            ) : (
              <div className={styles.empty}>Nenhum produto encontrado no estoque.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}