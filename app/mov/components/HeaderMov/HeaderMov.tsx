'use client';

import { useRouter } from 'next/navigation';
import styles from './HeaderMov.module.css';

// Definindo o que o componente precisa receber
interface FormSectionProps {
  titulo: string;
  labelDescricao: string;
  valor: string;
  setValor: (val: string) => void;
  placeholder?: string; // O '?' indica que é opcional
}

export default function HeaderMov({ 
  titulo, 
  labelDescricao, 
  valor, 
  setValor, 
  placeholder 
}: FormSectionProps) {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/')}>
          <span className={styles.icon}>←</span> VOLTAR
        </button>
        <h1 className={styles.mainTitle}>{titulo}</h1>
      </header>

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