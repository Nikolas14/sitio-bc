'use client';

import styles from './HeaderInput.module.css';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';

// Definindo o que o componente precisa receber
interface FormSectionProps {
  titulo: string;
  labelDescricao: string;
  valor: string;
  setValor: (val: string) => void;
  placeholder?: string; // O '?' indica que é opcional
}

export default function HeaderInput({
  titulo,
  labelDescricao,
  valor,
  setValor,
  placeholder
}: FormSectionProps) {

  return (
    <div className={styles.container}>

      <HeaderPadrao titulo={titulo} />
      
      <div className={styles.inputGroup}>
        <label className={styles.label}>{labelDescricao}</label>
        <input
          className={styles.field}
          value={valor}
          onChange={e => setValor(e.target.value)}
          placeholder={placeholder || "Digite aqui..."}
        />
      </div>
    
    </div>
  );
}