'use client';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import SideFooter from '@/components/SideFooter/SideFooter';
import { usePickingSummary } from '@/hooks/usePickingSummary';
import styles from './page.module.css';
import { PickingSidebarStats } from '../components/PickingSidebarStats/PickingSidebarStats';
import PickingSummaryTable from '../components/PickingSummaryTable/PickingSummaryTable';

export default function ResumoProjecaoPage() {
  const { consolidated, totalGeral, loading, refresh } = usePickingSummary();

  if (loading) return <div className={styles.center}>Calculando Picking List...</div>;

  return (
    <div className={styles.screen}>
      <aside className={styles.leftPanel}>
        <HeaderPadrao titulo="Resumo" />
        <PickingSidebarStats
          totalKg={totalGeral}
          totalItems={consolidated.length}
          onPrint={() => window.print()}
        />
        <SideFooter onRefresh={refresh} />
      </aside>

      <main className={styles.contentWrapper}>
        <PickingSummaryTable consolidated={consolidated} />
      </main>
    </div>
  );
}