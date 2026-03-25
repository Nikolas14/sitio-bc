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

  // 1. Tipos únicos para os botões de filtro
  const availableTypes = useMemo(() => {
    const types = products.map(p => p.type).filter(Boolean) as string[];
    return Array.from(new Set(types)).sort();
  }, [products]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // 2. Filtro de Nome + Tipo
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchName = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = selectedTypes.length === 0 || (p.type && selectedTypes.includes(p.type));
      return matchName && matchType;
    });
  }, [products, searchTerm, selectedTypes]);

  // 3. Cálculo do Peso Total Filtrado
  const totalWeight = useMemo(() => {
    return filteredProducts.reduce((acc, p) => acc + (Number(p.current_stock) || 0), 0);
  }, [filteredProducts]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Estoque Atual</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredProducts.length} Produtos</p>
        </div>
        
        <div className="flex gap-3">
          <button onClick={() => window.print()} className={styles.printBtn}>
            🖨️ IMPRIMIR
          </button>
          <button onClick={() => router.push('/')} className="text-xs font-bold text-blue-500 uppercase">Sair</button>
        </div>
      </header>

      {/* FILTROS */}
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
            <button onClick={() => setSelectedTypes([])} className="text-[9px] font-black text-red-500 underline ml-2">LIMPAR</button>
          )}
        </div>
        
        <input 
          type="text"
          className={styles.searchBar}
          placeholder="Pesquisar por descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </section>

      {/* TABELA DE ESTOQUE */}
      <div className={styles.table}>
        <div className={`${styles.row} ${styles.rowHeader}`}>
          <span>ID</span>
          <span>Descrição do Produto</span>
          <span className="text-center">Categoria</span>
          <span className="text-right">Saldo (KG)</span>
        </div>

        {loading ? (
          <div className="p-20 text-center font-black text-slate-200">BUSCANDO...</div>
        ) : (
          filteredProducts.map(p => (
            <div key={p.id} className={styles.row}>
              <span className={styles.idText}>#{p.id}</span>
              <span className={styles.nameText}>{p.name}</span>
              <div className="flex justify-center">
                {p.type && <span className={styles.typeTag}>{p.type}</span>}
              </div>
              <span className={`${styles.stockText} ${
                (p.current_stock || 0) > 0 ? styles.positive : 
                (p.current_stock || 0) < 0 ? styles.negative : styles.zero
              }`}>
                {Number(p.current_stock).toFixed(3)}
              </span>
            </div>
          ))
        )}

        {/* RODAPÉ COM TOTAL - AJUDA A CABER NA PÁGINA */}
        {!loading && filteredProducts.length > 0 && (
          <div className="bg-slate-50 p-4 border-t-2 border-slate-900 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase italic print:block hidden">Beit Stock - Relatório de Conferência</span>
            <div className="text-right flex-1">
              <span className="text-[10px] font-black text-slate-400 uppercase mr-4">Peso Total:</span>
              <span className="text-xl font-black text-slate-900">{totalWeight.toFixed(3)} KG</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}