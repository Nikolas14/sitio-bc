'use client';

import styles from './ButtonFinish.module.css';

interface ButtonFinishProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  label?: string;
}

const ButtonFinish = ({ onClick, loading, disabled, label = 'FINALIZAR (F10)' }: ButtonFinishProps) => {
  return (
    <div className={styles.container}>
      <button
        className={styles.submitBtn}
        onClick={onClick}
        disabled={loading || disabled}
      >
        {loading ? (
          <span className={styles.loaderContent}>
            <svg className={styles.spinner} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            </svg>
            PROCESSANDO...
          </span>
        ) : label}
      </button>
    </div>
  );
};

export default ButtonFinish;