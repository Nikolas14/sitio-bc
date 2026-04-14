'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import SideFooter from '@/components/SideFooter/SideFooter';
import StatusFilter from '@/components/StatusFilter/StatusFilter';
import { useAvailability } from '@/hooks/useAvailability';
import styles from './page.module.css';
import AvailabilityTable from '../components/AvailabilityTable/AvailabilityTable';

export default function PainelDisponibilidadePage() {
  // O hook agora entrega as categorias prontas!
  const { data, categories, loading, refresh } = useAvailability();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    if (selectedGroups.length === 0) return data;
    return data.filter(item => selectedGroups.includes(item.type || 'Sem Categoria'));
  }, [data, selectedGroups]);

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  if (loading) return <div className={styles.center}>Sincronizando disponibilidades...</div>;

  return (
    <div className={styles.screen}>

      <aside className={styles.leftPanel}>
        <HeaderPadrao titulo="Estoque Crítico" />

        <div className={styles.sidebarContent}>

          <StatusFilter
            label="Filtrar por Categoria"
            options={categories}
            selectedOptions={selectedGroups}
            onToggle={toggleGroup}
            onClear={() => setSelectedGroups([])}
          />

          <div className={`
            ${styles.alertBox} 
            ${data.filter(i => i.saldo_previsto < 0).length > 0 ? styles.alertActive : ''}
          `}>
            <span className={styles.alertLabel}>PRODUTOS EM FALTA</span>
            <div className={styles.alertValue}>
              {data.filter(item => item.saldo_previsto < 0).length}
            </div>
            <p className={styles.alertDesc}>Itens que precisam de reposição imediata para atender as projeções.</p>
          </div>
        </div>

        <SideFooter onRefresh={refresh} />
      </aside>

      <main className={styles.contentWrapper}>
        <div className={styles.pageHeader}>
          <div>
            <h1>Painel de Disponibilidade</h1>
            <p>Estoque Real X Projeções de Saída</p>
          </div>
          <div className={styles.countInfo}>
            Exibindo <strong>{filteredData.length}</strong> itens
          </div>
        </div>

        <AvailabilityTable data={filteredData} />
      </main>

    </div>
  );
}