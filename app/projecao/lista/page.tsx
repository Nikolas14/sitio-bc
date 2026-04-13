'use client';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import { useProjectionsManager } from '@/hooks/useProjectionsManager';
import styles from './page.module.css';
import { ProjectionSidebarNav } from '../components/ProjectionSidebarNav/ProjectionSidebarNav';
import SideFooter from '@/components/SideFooter/SideFooter';
import ProjectionDetail from '../components/ProjectionDetail/ProjectionDetail';
import AdminPasswordModal from '../components/AdminPasswordModal/AdminPasswordModal';

export default function ListaProjecaoPage() {
  const {
    groupedProjections, loading, selectedRef, setSelectedRef,
    activeItems, showModal, setShowModal, password, setPassword,
    handleDelete, refresh
  } = useProjectionsManager();

  if (loading) return <div className={styles.center}>Carregando logística...</div>;

  return (
    <div className={styles.screen}>

      {/* BARRA LATERAL */}
      <aside className={styles.leftPanel}>
        <HeaderPadrao titulo="Projeções" />

        <ProjectionSidebarNav
          groupedProjections={groupedProjections}
          selectedRef={selectedRef}
          setSelectedRef={setSelectedRef}
        />

        <SideFooter onRefresh={refresh} />
      </aside>

      {/* DETALHES */}
      <main className={styles.contentWrapper}>
        <ProjectionDetail 
        selectedRef={selectedRef}
        activeItems={activeItems}
        onDelete={() => setShowModal(true)}
      />
      </main>

      {/* MODAL */}
      {showModal && (
        <AdminPasswordModal 
          password={password}
          setPassword={setPassword}
          onConfirm={handleDelete}
          onCancel={() => { setShowModal(false); setPassword(''); }}
        />
      )}
    </div>
  );
}