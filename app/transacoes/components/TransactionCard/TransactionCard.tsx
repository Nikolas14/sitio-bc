'use client';

import React from 'react';
import styles from './TransactionCard.module.css';

import { ITransaction } from '@/types/index';

interface TransactionCardProps {
  transaction: ITransaction; // Agora o TS sabe que existe .total_price, .serial_number, etc.
  isSelected: boolean;
  onClick: (id: string) => void;
}

const TransactionCard = ({ transaction, isSelected, onClick }: TransactionCardProps) => {
  const { id, serial_number, type, status, customer_vendor, created_at, total_price } = transaction;
  const isAdjust = status === 'AJUSTE';
  const badgeClass = isAdjust ? styles.adjust : type === 'IN' ? styles.in : styles.out;
  const badgeLabel = isAdjust
    ? (type === 'IN' ? '▲ AJUSTE' : '▼ AJUSTE')
    : (type === 'IN' ? '▲ ENTRADA' : '▼ VENDA');

  return (
    <div 
      className={`${styles.transCard} ${isSelected ? styles.activeCard : ''}`}
      onClick={() => onClick(id)}
    >
      <div className={styles.cardTop}>
        <span className={styles.serial}>#{serial_number}</span>
        <span className={`${styles.badge} ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      <p className={styles.customerName}>{customer_vendor}</p>

      <div className={styles.cardBottom}>
        <span className={styles.date}>
          {new Date(created_at).toLocaleDateString('pt-BR')}
        </span>
        <span className={styles.price}>
          R$ {Number(total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};

// React.memo evita que o card seja renderizado novamente se o ID selecionado não for o dele
export default React.memo(TransactionCard);