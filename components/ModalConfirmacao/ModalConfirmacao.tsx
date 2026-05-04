'use client';

import styles from './ModalConfirmacao.module.css';

interface ModalConfirmacaoProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    titulo: string;
    mensagem: string;
    loading?: boolean;
}

const ModalConfirmacao = ({ isOpen, onClose, onConfirm, titulo, mensagem, loading }: ModalConfirmacaoProps) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.icon}>⚠️</div>
                <h2>{titulo}</h2>
                <p>{mensagem}</p>
                <div className={styles.actions}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button className={styles.btnConfirm} onClick={onConfirm} disabled={loading}>
                        {loading ? 'Excluindo...' : 'Sim, Excluir'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalConfirmacao;