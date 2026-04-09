'use client';

import styles from './StatusStepper.module.css';
import { ITransaction } from '@/types';

interface StatusStepperProps {
  currentStatus: ITransaction['status'];
}

const STEPS: { key: ITransaction['status']; label: string; desc: string }[] = [
  { key: 'PENDENTE', label: 'Isopor', desc: 'Isopor proto pra enviar' },
  { key: 'ENVIADO', label: 'Envio', desc: 'Despachado na tranportadora' },
  { key: 'COBRADO', label: 'Cobrado', desc: 'Cobrança enviado para o cliente' },
  { key: 'CONCLUIDO', label: 'Finalizado', desc: 'Pago' },
];

export const StatusStepper = ({ currentStatus }: StatusStepperProps) => {
  const currentIndex = STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className={styles.stepper}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        
        return (
          <div key={step.key} className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}>
            <div className={styles.indicator}>
              <div className={styles.circle}>
                {isCompleted ? '✓' : index + 1}
              </div>
              {index < STEPS.length - 1 && <div className={styles.line} />}
            </div>
            <div className={styles.content}>
              <span className={styles.label}>{step.label}</span>
              <span className={styles.desc}>{step.desc}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};