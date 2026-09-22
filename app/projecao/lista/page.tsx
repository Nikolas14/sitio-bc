'use client';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import { useProjectionsManager } from '@/hooks/useProjectionsManager';
import styles from './page.module.css';
import { ProjectionSidebarNav } from '../components/ProjectionSidebarNav/ProjectionSidebarNav';
import SideFooter from '@/components/SideFooter/SideFooter';
import ProjectionDetail from '../components/ProjectionDetail/ProjectionDetail';
import AdminPasswordModal from '../../../components/AdminPasswordModal/AdminPasswordModal';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';

export default function ListaProjecaoPage() {
  const toast = useToast();
  const {
    groupedProjections, loading, error, selectedRef, setSelectedRef,
    activeItems, showModal, setShowModal, password, setPassword,
    handleDelete, refresh
  } = useProjectionsManager();

  const onConfirmDelete = async () => {
    const ok = await handleDelete();
    if (ok) toast.success('Projeção excluída.');
    else toast.error(error ?? 'Não foi possível excluir.');
  };

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
          onConfirm={onConfirmDelete}
          onCancel={() => { setShowModal(false); setPassword(''); }}
        />
      )}
    </PageLayout>
  );
}