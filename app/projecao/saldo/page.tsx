'use client';

import { useState, useMemo } from 'react';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import SideFooter from '@/components/SideFooter/SideFooter';
import StatusFilter from '@/components/StatusFilter/StatusFilter';
import { useAvailability } from '@/hooks/useAvailability';
import styles from './page.module.css';
import AvailabilityTable from '../components/AvailabilityTable/AvailabilityTable';
import { PageLayout, Sidebar, Main, PageHeader, PageState } from '@/components/PageLayout/PageLayout';

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

  return (
    <PageLayout>

      <Sidebar>
        <HeaderPadrao titulo="Estoque Crítico" />

        <StatusFilter
          label="Filtrar por Categoria"
          options={categories}
          selectedOptions={selectedGroups}
          onToggle={toggleGroup}
          onClear={() => setSelectedGroups([])}
        />

        {!loading && (
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
        )}

        <SideFooter onRefresh={refresh} />
      </Sidebar>

      <Main>
        <PageHeader
          title="Painel de Disponibilidade"
          subtitle="Estoque Real X Projeções de Saída"
          aside={<>Exibindo <strong>{filteredData.length}</strong> itens</>}
        />

        {loading ? (
          <PageState kind="loading" message="Sincronizando disponibilidades..." />
        ) : (
          <AvailabilityTable data={filteredData} />
        )}
      </Main>

    </PageLayout>
  );
}