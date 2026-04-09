'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/api/supabase';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import styles from './page.module.css';

export default function ResumoProjecaoPage() {
  const [projections, setProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Busca apenas o que está aberto para o resumo de saída
      const { data } = await supabase
        .from('ESTOQUE_projection')
        .select(`quant, ESTOQUE_product ( id, name )`)
        .eq('status', 'ABERTO');

      setProjections(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // AGREGADOR: Soma as quantidades por ID de produto
  const consolidated = useMemo(() => {
    const map = new Map();

    projections.forEach(item => {
      const prodId = item.ESTOQUE_product?.id;
      const name = item.ESTOQUE_product?.name;
      const current = map.get(prodId) || { name, total: 0 };
      
      map.set(prodId, {
        name,
        total: current.total + Number(item.quant)
      });
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [projections]);

  const totalGeral = consolidated.reduce((acc, curr) => acc + curr.total, 0);

  if (loading) return <div className={styles.center}>Calculando totais...</div>;

  return (
    <div className={styles.container}>
      <HeaderPadrao titulo="Resumo Geral de Saídas" />

      <div className={styles.dashboard}>
        {/* Card de Destaque */}
        <div className={styles.mainStat}>
          <span className={styles.statLabel}>PESO TOTAL A SER DESPACHADO</span>
          <div className={styles.statValue}>{totalGeral.toFixed(2)} <small>KG</small></div>
        </div>

        {/* Tabela de Picking */}
        <div className={styles.tableWrapper}>
          <table className={styles.summaryTable}>
            <thead>
              <tr>
                <th>PRODUTO</th>
                <th className={styles.textRight}>TOTAL NECESSÁRIO</th>
                <th className={styles.textCenter}>STATUS NO ESTOQUE</th>
              </tr>
            </thead>
            <tbody>
              {consolidated.map((item, idx) => (
                <tr key={idx}>
                  <td className={styles.productName}>{item.name}</td>
                  <td className={`${styles.textRight} ${styles.totalQuant}`}>
                    {item.total.toFixed(2)} KG
                  </td>
                  <td className={styles.textCenter}>
                    <span className={styles.pickBadge}>AGUARDANDO COBRANÇA</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <button className={styles.btnPrint} onClick={() => window.print()}>
        🖨️ Imprimir Lista de Separação
      </button>
    </div>
  );
}