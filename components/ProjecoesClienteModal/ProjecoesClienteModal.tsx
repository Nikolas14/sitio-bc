'use client';

import { useState } from 'react';
import AdminPasswordModal from '@/components/AdminPasswordModal/AdminPasswordModal';
import { useToast } from '@/components/Toast/Toast';
import { useProjecoesCliente } from '@/hooks/useProjecoesCliente';
import styles from './ProjecoesClienteModal.module.css';

interface ProjecoesClienteModalProps {
  customerId: string;
  customerName: string;
  onClose: () => void;
}

const formatarData = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ProjecoesClienteModal({ customerId, customerName, onClose }: ProjecoesClienteModalProps) {
  const toast = useToast();
  const { grupos, loading, error, selectedKeys, toggleSelecao, toggleTodas, excluirSelecionadas } = useProjecoesCliente(customerId);

  const [showSenha, setShowSenha] = useState(false);
  const [password, setPassword] = useState('');

  const allSelected = grupos.length > 0 && selectedKeys.length === grupos.length;

  const confirmarExclusao = async () => {
    const ok = await excluirSelecionadas(password);

    if (ok) {
      setShowSenha(false);
      setPassword('');
      toast.success('Projeções excluídas.');
    } else {
      toast.error(error ?? 'Não foi possível excluir.');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="projecoes-cliente-titulo">
        <header className={styles.header}>
          <div>
            <h2 id="projecoes-cliente-titulo" className={styles.title}>Projeções do cliente</h2>
            <p className={styles.subtitle}>{customerName}</p>
          </div>
          <button type="button" className={styles.btnClose} onClick={onClose} aria-label="Fechar">✕</button>
        </header>

        <div className={styles.body}>
          {loading && <p className={styles.empty}>Carregando projeções...</p>}

          {!loading && error && <p className={styles.errorMsg}>{error}</p>}

          {!loading && !error && grupos.length === 0 && (
            <p className={styles.empty}>Nenhuma projeção deste cliente.</p>
          )}

          {!loading && grupos.length > 0 && (
            <>
              <label className={styles.selectAll}>
                <input type="checkbox" checked={allSelected} onChange={toggleTodas} />
                Selecionar todas ({grupos.length})
              </label>

              <ul className={styles.list}>
                {grupos.map(grupo => {
                  const checked = selectedKeys.includes(grupo.key);
                  return (
                    <li key={grupo.key} className={`${styles.item} ${checked ? styles.itemSelected : ''}`}>
                      <label className={styles.itemLabel}>
                        <input type="checkbox" checked={checked} onChange={() => toggleSelecao(grupo.key)} />
                        <div className={styles.itemInfo}>
                          <strong>{grupo.reference}</strong>
                          <span>
                            {formatarData(grupo.createdAt)} · {grupo.items.length} produto(s) · {grupo.totalKg.toFixed(2)} KG
                          </span>
                        </div>
                        <span className={styles.status}>{grupo.status}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>Fechar</button>
          <button
            type="button"
            className={styles.btnDanger}
            disabled={selectedKeys.length === 0}
            onClick={() => setShowSenha(true)}
          >
            Excluir selecionadas ({selectedKeys.length})
          </button>
        </footer>
      </div>

      {showSenha && (
        <AdminPasswordModal
          password={password}
          setPassword={setPassword}
          onConfirm={confirmarExclusao}
          onCancel={() => { setShowSenha(false); setPassword(''); }}
          subtitle={`Confirme a senha para excluir ${selectedKeys.length} projeção(ões)`}
        />
      )}
    </div>
  );
}
