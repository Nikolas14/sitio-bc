'use client';

import { useState } from 'react';
import styles from './DiscountInput.module.css';

interface DiscountInputProps {
  value: number;
  onApply: (val: number) => void;
}

const DiscountInput = ({ value, onApply }: DiscountInputProps) => {
  // 1. Iniciamos como string. Se for 0, deixamos string vazia ''
  const [tempValue, setTempValue] = useState(value === 0 ? '' : value.toString());

  const handleConfirm = () => {
    // 2. Ao confirmar, transformamos em número. Se estiver vazio, vira 0.
    const numericValue = Number(tempValue) || 0;
    onApply(numericValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
  };

  return (
    <div className={styles.inputGroup}>
      <label className={styles.label}>Desconto Aplicado (%)</label>
      <div className={styles.inputWrapper}>
        <input 
          type="number" 
          className={styles.field} 
          // O valor mostrado será o que o usuário digita, sem zeros à esquerda automáticos
          value={tempValue} 
          onChange={e => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: 10" // O placeholder aparece quando o campo está vazio
          min="0"
          max="100"
        />
        <button 
          className={styles.confirmBtn} 
          onClick={handleConfirm}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default DiscountInput;