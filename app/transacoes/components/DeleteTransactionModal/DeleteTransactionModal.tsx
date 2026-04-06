'use client';

import { useState } from 'react';
import styles from './DeleteTransactionModal.module.css';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  isDeleting: boolean;
}

export default function DeleteTransactionModal({ isOpen, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Confirmar Exclusão</h3>
        <p>Esta ação estornará o estoque e apagará o registro permanentemente.</p>
        
        <input 
          type="password" 
          placeholder="Digite a senha de administrador" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.passwordInput}
        />

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancelar</button>
          <button 
            onClick={() => onConfirm(password)} 
            className={styles.confirmBtn}
            disabled={isDeleting || !password}
          >
            {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
}