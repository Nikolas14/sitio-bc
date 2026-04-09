'use client';

import styles from './SideFooter.module.css';

interface SideFooterProps {
  onRefresh: () => void;
  refreshLabel?: string;
  children?: React.ReactNode; // Para permitir cards extras acima do botão
}

const SideFooter = ({ 
  onRefresh, 
  refreshLabel = "Atualizar Dados", 
  children 
}: SideFooterProps) => {
  return (
    <div className={styles.sideFooter}>
      {/* Renderiza conteúdo extra (como o card de total) se existir */}
      {children && <div className={styles.extraContent}>{children}</div>}
      
      <button onClick={onRefresh} className={styles.secondaryBtn}>
        <span>🔄</span> {refreshLabel}
      </button>
    </div>
  );
};

export default SideFooter;