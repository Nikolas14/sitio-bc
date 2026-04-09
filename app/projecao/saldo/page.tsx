'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import styles from './page.module.css';

export default function PainelDisponibilidadePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      const { data: result } = await supabase
        .from('ESTOQUE_v_estoque_vs_projecao')
        .select('*')
        .order('saldo_previsto', { ascending: true }); // Mostra o que vai faltar primeiro

      setData(result || []);
      setLoading(false);
    };
    fetchComparison();
  }, []);

  if (loading) return <div className={styles.center}>Analisando disponibilidade...</div>;

  return (
    <div className={styles.container}>
      <HeaderPadrao titulo="Disponibilidade para Envios" />

      <div className={styles.infoBar}>
        <p>Este painel compara o <strong>Estoque Real</strong> com as <strong>Projeções Abertas</strong>.</p>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>PRODUTO</th>
              <th className={styles.textRight}>ESTOQUE ATUAL</th>
              <th className={styles.textRight}>PROJETADO (SAÍDA)</th>
              <th className={styles.textRight}>SALDO PREVISTO</th>
              <th className={styles.textCenter}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const estoque = Number(item.estoque_real);
              const projecao = Number(item.total_projetado);
              const saldo = Number(item.saldo_previsto);

              // Lógica de Status
              let statusClass = styles.ok;
              let statusLabel = 'DISPONÍVEL';

              if (saldo < 0) {
                statusClass = styles.danger;
                statusLabel = 'FALTANDO';
              } else if (saldo === 0 && projecao > 0) {
                statusClass = styles.warning;
                statusLabel = 'LIMITE';
              }

              return (
                <tr key={item.product_id} className={saldo < 0 ? styles.rowError : ''}>
                  <td className={styles.productName}>{item.product_name}</td>
                  <td className={styles.textRight}>{estoque.toFixed(2)} KG</td>
                  <td className={styles.textRight}>{projecao.toFixed(2)} KG</td>
                  <td className={`${styles.textRight} ${styles.bold}`}>
                    {saldo.toFixed(2)} KG
                  </td>
                  <td className={styles.textCenter}>
                    <span className={`${styles.badge} ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}