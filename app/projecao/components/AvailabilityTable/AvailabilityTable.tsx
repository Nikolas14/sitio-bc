'use client';

import { useMemo } from 'react';
import styles from './AvailabilityTable.module.css';

interface AvailabilityItem {
  product_id: number | string;
  product_name: string;
  estoque_real: number;
  total_projetado: number;
  saldo_previsto: number;
  type?: string;
}

const NO_CATEGORY = 'Sem Categoria';

const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function AvailabilityTable({ data }: { data: AvailabilityItem[] }) {
  // Agrupa por categoria (A–Z, "Sem Categoria" por último); dentro de cada grupo
  // os itens em falta vêm primeiro (a lista já chega ordenada por saldo).
  const groups = useMemo(() => {
    const map = new Map<string, AvailabilityItem[]>();
    for (const item of data) {
      const key = item.type || NO_CATEGORY;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === NO_CATEGORY) return 1;
      if (b === NO_CATEGORY) return -1;
      return a.localeCompare(b, 'pt-BR');
    });
  }, [data]);

  if (data.length === 0) {
    return <div className={styles.empty}>Nenhum item encontrado.</div>;
  }

  return (
    <div className={styles.groups}>
      {groups.map(([category, items]) => {
        const shortage = items.filter(i => i.saldo_previsto < 0).length;

        return (
          <section key={category} className={styles.group}>
            <header className={styles.groupHeader}>
              <h2 className={styles.groupTitle}>{category}</h2>
              <span className={styles.groupCount}>{items.length} itens</span>
              {shortage > 0 && (
                <span className={styles.groupShortage}>{shortage} em falta</span>
              )}
            </header>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className={styles.num}>Físico</th>
                  <th className={styles.num}>Projetado</th>
                  <th className={styles.num}>Saldo</th>
                  <th className={styles.statusCol}>Situação</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isNegative = item.saldo_previsto < 0;
                  const isWarning = item.saldo_previsto === 0 && item.total_projetado > 0;
                  const rowClass = isNegative ? styles.rowDanger : isWarning ? styles.rowWarning : '';
                  const label = isNegative ? 'Em falta' : isWarning ? 'No limite' : 'OK';
                  const badgeClass = isNegative ? styles.badgeDanger : isWarning ? styles.badgeWarning : styles.badgeOk;

                  return (
                    <tr key={item.product_id} className={`${styles.row} ${rowClass}`}>
                      <td className={styles.name} title={item.product_name}>{item.product_name}</td>
                      <td className={styles.num}>{fmt.format(item.estoque_real)}</td>
                      <td className={styles.num}>{fmt.format(item.total_projetado)}</td>
                      <td className={`${styles.num} ${styles.balance} ${isNegative ? styles.balanceNegative : ''}`}>
                        {fmt.format(item.saldo_previsto)}
                      </td>
                      <td className={styles.statusCol}>
                        <span className={`${styles.badge} ${badgeClass}`}>{label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
