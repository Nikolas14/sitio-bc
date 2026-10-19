'use client';

import { useCustomerManager } from '@/hooks/useCustomerManager';
import SearchSelect, { normalize } from '@/components/SearchSelect/SearchSelect';
import type { ICustomer } from '@/types';
import styles from './CustomerFields.module.css';

interface CustomerFieldsProps {
  customer: ICustomer | null;
  setCustomer: (customer: ICustomer | null) => void;
  identifier: string;
  setIdentifier: (value: string) => void;
  /** Texto final que será gravado, mostrado como confirmação. */
  resultLabel: string;
}

const matchesCustomer = (c: ICustomer, q: string) =>
  [c.name, c.cpf, c.city].some(value => normalize(value || '').includes(q));

/** Cliente (principal) + Identificador (secundário, ex.: minuta, pedido, dia). */
export default function CustomerFields({
  customer,
  setCustomer,
  identifier,
  setIdentifier,
  resultLabel,
}: CustomerFieldsProps) {
  const { customers, loading } = useCustomerManager();

  return (
    <div className={styles.block}>
      <label className={styles.label}>Cliente</label>
      <SearchSelect
        items={customers}
        selected={customer}
        onSelect={setCustomer}
        matches={matchesCustomer}
        getKey={(c) => c.id}
        getLabel={(c) => c.name}
        renderOption={(c) => (
          <>
            <span>{c.name}</span>
            <small>{c.cpf || 'CPF não informado'}{c.city ? ` · ${c.city}` : ''}</small>
          </>
        )}
        placeholder="Buscar cliente por nome, CPF ou cidade..."
        emptyText="Cliente não encontrado"
        loading={loading}
      />

      <label className={styles.label}>Identificador</label>
      <input
        className={styles.textField}
        type="text"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="Ex: Minuta 1234, Sábado, Pedido 2..."
      />
      <span className={styles.preview}>Será salvo como: <strong>{resultLabel}</strong></span>
    </div>
  );
}
