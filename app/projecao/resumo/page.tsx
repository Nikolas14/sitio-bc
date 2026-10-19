'use client';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import SideFooter from '@/components/SideFooter/SideFooter';
import { usePickingSummary } from '@/hooks/usePickingSummary';
import { PickingSidebarStats } from '../components/PickingSidebarStats/PickingSidebarStats';
import PickingSummaryTable from '../components/PickingSummaryTable/PickingSummaryTable';
import { PageLayout, Sidebar, Main, PageState } from '@/components/PageLayout/PageLayout';

export default function ResumoProjecaoPage() {
  const { consolidated, totalGeral, loading, refresh } = usePickingSummary();

  return (
    <PageLayout>
      <Sidebar>
        <HeaderPadrao titulo="Resumo" />
        <PickingSidebarStats
          totalKg={totalGeral}
          onPrint={() => window.print()}
        />
        <SideFooter onRefresh={refresh} />
      </Sidebar>

      <Main>
        {loading ? (
          <PageState kind="loading" message="Calculando Picking List..." />
        ) : (
          <PickingSummaryTable consolidated={consolidated} />
        )}
      </Main>
    </PageLayout>
  );
}