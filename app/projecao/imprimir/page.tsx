'use client';

import { useState } from 'react';
import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import ButtonFinish from '@/components/ButtonFinish/ButtonFinish';
import CustomerFields from '@/components/CustomerFields/CustomerFields';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import type { ICustomer } from '@/types';

import styles from './page.module.css';
import pStyles from '../components/ProjectionPrint/ProjectionPrint.module.css';
import { CustomerInfo } from '../components/ProjectionPrint/ProjectionPrint';

export default function ImprimirPedidoPage() {
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [texto, setTexto] = useState('');
  const [emitidoEm, setEmitidoEm] = useState(() => new Date());

  // Mesma referência da projeção: cliente (principal) + complemento (secundário).
  const finalReference = [customer?.name, identifier.trim()].filter(Boolean).join(' · ') || 'PROJEÇÃO_AVULSA';

  // Data da impressão = momento em que o botão foi clicado.
  const onImprimir = () => {
    setEmitidoEm(new Date());
    setTimeout(() => window.print(), 0);
  };

  return (
    <PageLayout>
      <Sidebar>
        <div className={styles.topContent}>
          <HeaderPadrao titulo="Imprimir Pedido" />

          <CustomerFields
            customer={customer}
            setCustomer={setCustomer}
            identifier={identifier}
            setIdentifier={setIdentifier}
            resultLabel={finalReference}
          />
        </div>

        <div className={styles.footerActions}>
          <ButtonFinish
            onClick={onImprimir}
            loading={false}
            disabled={!texto.trim()}
            label="IMPRIMIR PEDIDO"
          />
        </div>
      </Sidebar>

      <Main>
        <div className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Pedido</h2>
            <span className={styles.panelBadge}>{customer ? customer.name : 'Sem cliente'}</span>
          </header>

          <div className={styles.panelBody}>
            {customer ? (
              <CustomerInfo customer={customer} />
            ) : (
              <p className={styles.hint}>Selecione o cliente na lateral para ver os dados aqui</p>
            )}
            <textarea
              className={styles.textarea}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cole o pedido aqui"
            />
          </div>
        </div>

        {/* Só aparece na impressão: cabeçalho, cliente e o pedido colado. */}
        <section className={`${styles.printSheet} ${pStyles.sheet}`}>
          <header className={pStyles.header}>
            <div>
              <span className={pStyles.eyebrow}>PEDIDO</span>
              <h2>BEIT CHABAD BELÉM</h2>
            </div>
            <div className={pStyles.date}>{emitidoEm.toLocaleString('pt-BR')}</div>
          </header>

          <div className={pStyles.reference}>
            <span>REFERÊNCIA</span>
            <strong>{finalReference}</strong>
            {identifier.trim() && <em>{identifier.trim()}</em>}
          </div>

          {customer && <CustomerInfo customer={customer} />}

          <pre className={styles.pedidoImpresso}>{texto}</pre>
        </section>
      </Main>
    </PageLayout>
  );
}
