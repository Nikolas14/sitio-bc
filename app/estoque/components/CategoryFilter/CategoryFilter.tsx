'use client';

import styles from './CategoryFilter.module.css';

interface CategoryFilterProps {
  categories: string[];
  selectedGroups: string[];
  onToggle: (category: string) => void;
  onClear: () => void;
}

const CategoryFilter = ({ 
  categories, 
  selectedGroups, 
  onToggle, 
  onClear 
}: CategoryFilterProps) => {
  return (
    <div className={styles.filterSection}>
      <label className={styles.sideLabel}>Filtrar Categorias</label>
      
      <div className={styles.chipGrid}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className={`${styles.chip} ${
              selectedGroups.includes(cat) ? styles.chipActive : ''
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {selectedGroups.length > 0 && (
        <button onClick={onClear} className={styles.clearBtn}>
          Limpar Filtros
        </button>
      )}
    </div>
  );
};

export default CategoryFilter;