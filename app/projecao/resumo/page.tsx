'use client';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import SideFooter from '@/components/SideFooter/SideFooter';
import { usePickingSummary } from '@/hooks/usePickingSummary';
import styles from './page.module.css';
import { PickingSidebarStats } from '../components/PickingSidebarStats/PickingSidebarStats';
import PickingSummaryTable from '../components/PickingSummaryTable/PickingSummaryTable';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';

export default function ResumoProjecaoPage() {
  const { consolidated, totalGeral, loading, refresh } = usePickingSummary();

  if (loading) return <div className={styles.center}>Calculando Picking List...</div>;

  return (
    <PageLayout>
      <Sidebar>
        <HeaderPadrao titulo="Resumo" />
        <PickingSidebarStats
          totalKg={totalGeral}
          totalItems={consolidated.length}
          onPrint={() => window.print()}
        />
        <SideFooter onRefresh={refresh} />
      </Sidebar>

      <Main>
        <PickingSummaryTable consolidated={consolidated} />
      </Main>
    </PageLayout>
  );
}