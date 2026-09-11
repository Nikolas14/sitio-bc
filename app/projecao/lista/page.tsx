'use client';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import { useProjectionsManager } from '@/hooks/useProjectionsManager';
import styles from './page.module.css';
import { ProjectionSidebarNav } from '../components/ProjectionSidebarNav/ProjectionSidebarNav';
import SideFooter from '@/components/SideFooter/SideFooter';
import ProjectionDetail from '../components/ProjectionDetail/ProjectionDetail';
import AdminPasswordModal from '../../../components/AdminPasswordModal/AdminPasswordModal';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';

export default function ListaProjecaoPage() {
  const {
    groupedProjections, loading, selectedRef, setSelectedRef,
    activeItems, showModal, setShowModal, password, setPassword,
    handleDelete, refresh
  } = useProjectionsManager();

  if (loading) return <div className={styles.center}>Carregando logística...</div>;

  return (
    <PageLayout>

      {/* BARRA LATERAL */}
      <Sidebar>
        <HeaderPadrao titulo="Projeções" />

        <ProjectionSidebarNav
          groupedProjections={groupedProjections}
          selectedRef={selectedRef}
          setSelectedRef={setSelectedRef}
        />

        <SideFooter onRefresh={refresh} />
      </Sidebar>

      {/* DETALHES */}
      <Main>
        <ProjectionDetail
          selectedRef={selectedRef}
          activeItems={activeItems}
          onDelete={() => setShowModal(true)}
        />
      </Main>

      {/* MODAL */}
      {showModal && (
        <AdminPasswordModal
          password={password}
          setPassword={setPassword}
          onConfirm={handleDelete}
          onCancel={() => { setShowModal(false); setPassword(''); }}
        />
      )}
    </PageLayout>
  );
}