'use client';

import { useRef, useState } from 'react';
import styles from './ProjectionManualForm.module.css';
import type { IProduct } from '@/types';
import SearchSelect, { normalize } from '../SearchSelect/SearchSelect';

interface ProjectionManualFormProps {
  products: IProduct[];
  onAdd: (product: IProduct, quantKg: number) => void;
  totalKg: number;
  totalPrice: number;
}

const matchesProduct = (p: IProduct, q: string) =>
  String(p.id) === q || normalize(p.name).includes(q);

export function ProjectionManualForm({ products, onAdd, totalKg, totalPrice }: ProjectionManualFormProps) {
  const [product, setProduct] = useState<IProduct | null>(null);
  const [quant, setQuant] = useState('');
  const [error, setError] = useState<string | null>(null);
  const quantRef = useRef<HTMLInputElement>(null);

  const handleSelect = (item: IProduct | null) => {
    setProduct(item);
    setError(null);
    if (item) setTimeout(() => quantRef.current?.focus(), 0);
  };

  const handleAdd = () => {
    const kg = Number(quant.replace(',', '.'));
    if (!product) return setError('Escolha um produto');
    if (!kg || kg <= 0) return setError('Informe a quantidade em KG');

    onAdd(product, kg);
    setProduct(null); // devolve o foco para a busca
    setQuant('');
    setError(null);
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.inputField}>
        <label className={styles.miniLabel}>Produto (nome ou ID)</label>
        <SearchSelect
          items={products}
          selected={product}
          onSelect={handleSelect}
          matches={matchesProduct}
          getKey={(p) => p.id}
          getLabel={(p) => p.name}
          renderOption={(p) => (
            <>
              <span>{p.name}</span>
              <small>ID {p.id}{p.type ? ` · ${p.type}` : ''}</small>
            </>
          )}
          placeholder="Digite para buscar..."
          emptyText="Produto não encontrado"
          maxResults={10}
        />
      </div>

      <div className={styles.quantRow}>
        <div className={styles.inputField}>
          <label className={styles.miniLabel}>Qtd (KG)</label>
          <input
            ref={quantRef}
            className={styles.field}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={quant}
            onChange={(e) => setQuant(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="0.00"
          />
        </div>
        <button type="button" className={styles.btnAdd} onClick={handleAdd}>
          Incluir
        </button>
      </div>

      {error && <span className={styles.alertMsg}>⚠️ {error}</span>}

      {/* RESUMO FINANCEIRO E DE CARGA */}
      <div className={styles.summaryBox}>
        <div className={styles.summaryItem}>
          <span className={styles.label}>TOTAL DO ENVIO</span>
          <div className={styles.weightValue}>
            {totalKg.toFixed(2)} <small className={styles.unit}>KG</small>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.summaryItem}>
          <span className={styles.label}>PREÇO PROJETADO</span>
          <div className={styles.priceValue}>
            <small className={styles.unit}>R$</small> {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}
