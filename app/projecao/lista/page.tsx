'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import styles from './page.module.css';

export default function ListaProjecaoPage() {
  const [projections, setProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Modal
  const [showModal, setShowModal] = useState(false);
  const [refToDelete, setRefToDelete] = useState('');
  const [password, setPassword] = useState('');

  const fetchProjections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ESTOQUE_projection')
      .select(`*, ESTOQUE_product ( name )`)
      .order('created_at', { ascending: false });

    if (!error) setProjections(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjections();
  }, []);

  const groupedProjections = useMemo(() => {
    return projections.reduce((acc: any, item) => {
      const ref = item.reference || 'Sem Referência';
      if (!acc[ref]) acc[ref] = [];
      acc[ref].push(item);
      return acc;
    }, {});
  }, [projections]);

  // Função disparada ao clicar no botão de excluir do Card
  const openDeleteModal = (ref: string) => {
    setRefToDelete(ref);
    setShowModal(true);
  };

  // Função que valida a senha e deleta no banco
  const confirmDeletion = async () => {
    if (password === '123') { // Defina sua senha de admin aqui
      const { error } = await supabase
        .from('ESTOQUE_projection')
        .delete()
        .eq('reference', refToDelete);

      if (!error) {
        setShowModal(false);
        setPassword('');
        fetchProjections();
      } else {
        alert("Erro ao deletar no banco.");
      }
    } else {
      alert("Senha administrativa incorreta!");
    }
  };

  if (loading) return <div className={styles.center}>Carregando...</div>;

  return (
    <div className={styles.container}>
      <HeaderPadrao titulo="Projeções Salvas" />
      
      <div className={styles.grid}>
        {Object.entries(groupedProjections).map(([ref, items]: [string, any]) => (
          <section key={ref} className={styles.card}>
            <header className={styles.cardHeader}>
              <h2 className={styles.refTitle}>{ref}</h2>
              <button 
                className={styles.btnTrash} 
                onClick={() => openDeleteModal(ref)}
              >
                🗑️
              </button>
            </header>

            <ul className={styles.itemList}>
              {items.map((item: any) => (
                <li key={item.id} className={styles.itemRow}>
                  <span>{item.ESTOQUE_product?.name}</span>
                  <span className={styles.mono}>{item.quant} KG</span>
                </li>
              ))}
            </ul>

            <footer className={styles.cardFooter}>
              <span className={styles.totalLabel}>TOTAL CARGA</span>
              <span className={styles.totalValue}>
                {items.reduce((acc: number, i: any) => acc + Number(i.quant), 0).toFixed(2)} KG
              </span>
            </footer>
          </section>
        ))}
      </div>

      {/* MODAL DE SEGURANÇA */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Exclusão</h3>
            <p>Você está prestes a apagar a projeção: <strong>{refToDelete}</strong></p>
            <input 
              type="password" 
              className={styles.modalInput}
              placeholder="Senha de Admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => { setShowModal(false); setPassword(''); }}>
                Cancelar
              </button>
              <button className={styles.btnConfirm} onClick={confirmDeletion}>
                Confirmar e Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}