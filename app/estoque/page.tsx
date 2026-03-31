'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useInventory } from '@/hooks/useInventory';

export default function EstoquePage() {
  const router = useRouter();
  const { products, loading } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // 1. Tipos únicos para os botões de filtro (Mantido)
  const availableTypes = useMemo(() => {
    const types = products.map(p => p.type).filter(Boolean) as string[];
    return Array.from(new Set(types)).sort();
  }, [products]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type) // Se já existe, remove (desmarca)
        : [...prev, type]              // Se não existe, adiciona (marca)
    );
  };
  // 2. Filtro Geral
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchName = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = selectedTypes.length === 0 || (p.type && selectedTypes.includes(p.type));
      return matchName && matchType;
    });
  }, [products, searchTerm, selectedTypes]);

  // 3. AGRUPAMENTO POR CATEGORIA (O NOVO "CORAÇÃO" DA PÁGINA)
  const groupedProducts = useMemo(() => {
    const groups: Record<string, typeof products> = {};

    filteredProducts.forEach(p => {
      const category = p.type || 'Sem Categoria';
      if (!groups[category]) groups[category] = [];
      groups[category].push(p);
    });

    // Retorna as categorias em ordem alfabética
    return Object.keys(groups).sort().map(category => ({
      name: category,
      items: groups[category]
    }));
  }, [filteredProducts]);

  const totalWeight = useMemo(() => {
    return filteredProducts.reduce((acc, p) => acc + (Number(p.current_stock) || 0), 0);
  }, [filteredProducts]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>Estoque Atual</h1>
          <p>{filteredProducts.length} itens catalogados</p>
        </div>

        <div className={styles.actionGroup}>
          {/* Botão de Imprimir com ícone melhorado */}

          <button onClick={() => router.push('/')} className={styles.exitBtn}>
            SAIR
          </button>
        </div>
      </header>

      {/* FILTROS (Mantidos) */}
      <section className={styles.filterSection}>
        <div className={styles.typeGrid}>
          {availableTypes.map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`${styles.typeBtn} ${selectedTypes.includes(type) ? styles.typeBtnActive : ''}`}
            >
              {type}
            </button>
          ))}

          {selectedTypes.length > 0 && (
            <button
              onClick={() => setSelectedTypes([])}
              className={styles.clearBtn}
            >
              ✕ Limpar Filtros
            </button>
          )}
        </div>

        <input
          type="text"
          className={styles.searchBar}
          placeholder="O que você está procurando?"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </section>
      {/* RENDERIZAÇÃO POR GRUPOS */}
      {loading ? (
        <div className="p-20 text-center font-black text-slate-200 uppercase animate-pulse">Carregando Inventário...</div>
      ) : (
        <div className={styles.mainContent}>
          {groupedProducts.map(group => (
            <section key={group.name} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                <span>{group.name}</span>
                <small className="ml-2 opacity-50 font-normal">({group.items.length} itens)</small>
              </h2>

              <div className={styles.productGrid}>
                {group.items.map(p => (
                  <div key={p.id} className={styles.productCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.idBadge}>#{p.id}</span>
                      <h3 className={styles.productName}>{p.name}</h3>
                    </div>
                    <div className={styles.stockContainer}>
                      <span className={styles.stockLabel}>Saldo em KG</span>
                      <span className={`${styles.stockValue} ${(p.current_stock || 0) > 0 ? styles.positive :
                          (p.current_stock || 0) < 0 ? styles.negative : styles.zero
                        }`}>
                        {Number(p.current_stock).toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* TOTALIZADOR NO RODAPÉ */}
      {!loading && (
        <footer className={styles.footerTotal}>
          <div className="text-right w-full">
            <span className="text-xs font-bold text-slate-400 uppercase mr-4">Total Geral do Estoque:</span>
            <span className="text-2xl font-black text-slate-900">{totalWeight.toFixed(3)} KG</span>
          </div>
        </footer>
      )}
    </div>
  );
}