'use client';

import styles from './ProjectionSidebarNav.module.css';

interface ProjectionSidebarNavProps {
  groupedProjections: Record<string, any[]>;
  selectedRef: string | null;
  setSelectedRef: (ref: string) => void;
}

export const ProjectionSidebarNav = ({ 
  groupedProjections, 
  selectedRef, 
  setSelectedRef 
}: ProjectionSidebarNavProps) => {
  
  const entries = Object.entries(groupedProjections);

  return (
    <div className={styles.navContainer}>
      <div className={styles.navHeader}>
        <span className={styles.title}>Cargas Salvas</span>
        <span className={styles.countBadge}>{entries.length}</span>
      </div>

      <nav className={styles.sidebarNav}>
        {entries.map(([ref, items]) => {
          // Cálculo do total de cada item da lista
          const totalKg = items.reduce(
            (acc: number, i: any) => acc + Number(i.quant), 
            0
          );

          return (
            <button
              key={ref}
              className={`${styles.navItem} ${selectedRef === ref ? styles.active : ''}`}
              onClick={() => setSelectedRef(ref)}
            >
              <div className={styles.navInfo}>
                <span className={styles.navRef}>{ref}</span>
                <span className={styles.navDate}>
                  {new Date(items[0].created_at).toLocaleDateString()}
                </span>
              </div>
              <span className={styles.navTotal}>{totalKg.toFixed(1)}kg</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};