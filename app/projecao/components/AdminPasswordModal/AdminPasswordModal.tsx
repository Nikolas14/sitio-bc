'use client';

import styles from './AdminPasswordModal.module.css';

interface AdminPasswordModalProps {
  password: string;
  setPassword: (val: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminPasswordModal({
  password,
  setPassword,
  onConfirm,
  onCancel
}: AdminPasswordModalProps) {
  
  // Função para confirmar ao apertar "Enter"
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onConfirm();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3 className={styles.title}>Senha de Admin</h3>
        <p className={styles.subtitle}>Confirme a senha para realizar esta exclusão</p>
        
        <input
          type="password"
          value={password}
          className={styles.modalInput}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="••••••"
        />

        <div className={styles.modalActions}>
          <button className={styles.btnCancel} onClick={onCancel}>
            Voltar
          </button>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}