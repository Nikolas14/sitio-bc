'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import styles from './SearchSelect.module.css';

export const normalize = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

interface SearchSelectProps<T> {
  items: T[];
  selected: T | null;
  onSelect: (item: T | null) => void;
  /** Recebe a busca já normalizada (sem acento, minúscula). */
  matches: (item: T, query: string) => boolean;
  getKey: (item: T) => string | number;
  getLabel: (item: T) => string;
  renderOption?: (item: T) => ReactNode;
  placeholder?: string;
  emptyText?: string;
  maxResults?: number;
  loading?: boolean;
}

export default function SearchSelect<T>({
  items,
  selected,
  onSelect,
  matches,
  getKey,
  getLabel,
  renderOption,
  placeholder = 'Buscar...',
  emptyText = 'Nada encontrado.',
  maxResults = 8,
  loading = false,
}: SearchSelectProps<T>) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const hadSelection = useRef(false);

  const results = useMemo(() => {
    const q = normalize(query);
    const list = q ? items.filter(item => matches(item, q)) : items;
    return list.slice(0, maxResults);
  }, [items, query, matches, maxResults]);

  // Ao limpar a seleção, devolve o foco para a busca.
  useEffect(() => {
    if (hadSelection.current && !selected) inputRef.current?.focus();
    hadSelection.current = !!selected;
  }, [selected]);

  const choose = (item: T) => {
    onSelect(item);
    setQuery('');
    setOpen(false);
    setActive(0);
  };

  if (selected) {
    return (
      <div className={styles.chip}>
        <span className={styles.chipLabel}>{getLabel(selected)}</span>
        <button type="button" className={styles.chipClear} onClick={() => onSelect(null)} title="Trocar">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        value={query}
        placeholder={loading ? 'Carregando...' : placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            setActive(i => Math.min(i + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(i => Math.max(i - 1, 0));
          } else if (e.key === 'Enter' && open && results[active]) {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />

      {open && (
        <ul className={styles.dropdown}>
          {results.length === 0 ? (
            <li className={styles.empty}>{emptyText}</li>
          ) : (
            results.map((item, index) => (
              <li key={getKey(item)}>
                <button
                  type="button"
                  className={`${styles.option} ${index === active ? styles.optionActive : ''}`}
                  // mouseDown evita o blur do input fechar a lista antes do clique
                  onMouseDown={(e) => { e.preventDefault(); choose(item); }}
                  onMouseEnter={() => setActive(index)}
                >
                  {renderOption ? renderOption(item) : getLabel(item)}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
