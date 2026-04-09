'use client';

import { forwardRef } from 'react';
import styles from './BarcodeScanner.module.css';

interface BarcodeScannerProps {
  label?: string;
  barcode: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

// Usamos forwardRef para que o componente pai consiga controlar o foco do input
const BarcodeScanner = forwardRef<HTMLInputElement, BarcodeScannerProps>(
  ({ label = "Bipe o Código", barcode, onChange, placeholder }, ref) => {
    return (
      <div className={styles.barcodeBox}>
        <label className={styles.label}>{label}</label>
        <div className={styles.inputWrapper}>
          <span className={styles.barcodeIcon}>🔍</span>
          <input
            ref={ref}
            className={styles.bigInput}
            value={barcode}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
            placeholder={placeholder || "0000000000000"}
            inputMode="numeric" // Melhora o teclado em dispositivos móveis
          />
        </div>
        <p className={styles.helperText}>Aguardando leitura do scanner...</p>
      </div>
    );
  }
);

BarcodeScanner.displayName = 'BarcodeScanner';

export default BarcodeScanner;