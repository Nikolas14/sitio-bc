'use client';

import styles from './ProjectionPrint.module.css';
import type { ICustomer } from '@/types';

export interface PrintItem {
  name: string;
  weightKg: number;
}

export interface PrintData {
  reference: string;
  subname: string;
  customer: ICustomer | null;
  items: PrintItem[];
  date: Date;
}

const kg = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });

// Dados do cliente: 4 colunas x 4 linhas, usado na impressão da projeção e em /projecao/imprimir.
export function CustomerInfo({ customer }: { customer: ICustomer }) {
  return (
    <div className={styles.customerData}>
      <div><span>CLIENTE</span><strong>{customer.name || '-'}</strong></div>
      <div><span>CPF</span><strong>{customer.cpf || '-'}</strong></div>
      <div><span>DESCONTO</span><strong>{Number(customer.discount_percent) || 0}%</strong></div>
      <div><span>TELEFONE</span><strong>{customer.phone || '-'}</strong></div>
      <div><span>ENDEREÇO</span><strong>{customer.address || '-'}</strong></div>
      <div><span>CEP</span><strong>{customer.cep || '-'}</strong></div>
      <div><span>CIDADE</span><strong>{customer.city || '-'}</strong></div>
      <div><span>AEROPORTO</span><strong>{customer.airport || '-'}</strong></div>
      <div><span>RETIRADA</span><strong>{customer.pickup_person || '-'}</strong></div>
      <div><span>CPF RETIRADA</span><strong>{customer.pickup_cpf || '-'}</strong></div>
      <div><span>RETIRADA ALTERNATIVA</span><strong>{customer.alternative_pickup_person || '-'}</strong></div>
      <div><span>CPF RETIRADA ALTERNATIVA</span><strong>{customer.alternative_pickup_cpf || '-'}</strong></div>
      <div><span>OBSERVAÇÕES DO CLIENTE</span><strong>{customer.notes || '-'}</strong></div>
    </div>
  );
}

export default function ProjectionPrint({ data }: { data: PrintData }) {
  const { customer, items } = data;
  const total = items.reduce((acc, i) => acc + i.weightKg, 0);

  return (
    <section className={styles.sheet}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>PEDIDO</span>
          <h2>BEIT CHABAD BELÉM</h2>
        </div>
        <div className={styles.date}>{data.date.toLocaleString('pt-BR')}</div>
      </header>

      <div className={styles.reference}>
        <span>REFERÊNCIA</span>
        <strong>{data.reference}</strong>
        {data.subname && <em>{data.subname}</em>}
      </div>

      {customer && <CustomerInfo customer={customer} />}

      <div className={styles.items}>
        <h3>ITENS DO PEDIDO</h3>
        <table>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.name}-${index}`}>
                <td className={styles.idx}>{index + 1}.</td>
                <td className={styles.name}>{item.name}</td>
                <td className={styles.qty}>{kg.format(item.weightKg)} kg</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>TOTAL</td>
              <td className={styles.qty}>{kg.format(total)} kg</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
