'use client';

import styles from './page.module.css';

import { useMemo, useState } from 'react';

import { useInventory } from '@/hooks/useInventory';

import GrupoEstoque from '../../components/GrupoEstoque/GrupoEstoque';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import StatusFilter from '@/components/StatusFilter/StatusFilter';
import SideFooter from '@/components/SideFooter/SideFooter';
import { PageLayout, Sidebar, Main, PageState } from '@/components/PageLayout/PageLayout';

export default function EstoqueReportPage() {
  const { products, loading, error, refresh } = useInventory();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Agrupamento dos dados corrigido
  const groupedData = useMemo(() => {
    type GrupoItem = { id: number; name: string; current_stock: number };
    const groups: Record<string, GrupoItem[]> = {};

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

  return (
    <PageLayout>
      <Sidebar>
        <HeaderPadrao titulo='Estoque geral' />

        <StatusFilter
          label="Filtrar tipos"
          options={categories}
          selectedOptions={selectedGroups}
          onToggle={toggleGroup}
          onClear={() => setSelectedGroups([])}
        />

        <SideFooter onRefresh={refresh} refreshLabel="Sincronizar Dados">
          <></>
        </SideFooter>
      </Sidebar>

      <Main>
        {error ? (
          <PageState kind="error" message={`Erro: ${error}`} />
        ) : loading ? (
          <PageState kind="loading" message="Buscando inventário..." />
        ) : visibleGroups.length === 0 ? (
          <PageState kind="empty" message="Nenhum produto encontrado no estoque." />
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
      </Main>
    </PageLayout>
  );
}