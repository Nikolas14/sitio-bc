'use client';

import { useRef } from 'react';
import { useParams } from 'next/navigation';
import { useCobrancaManager } from '@/hooks/useCobrancaManager';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import { ReceiptCard } from '../components/ReceiptCard/ReceiptCard';
import { StatusStepper } from '../components/StatusStepper/StatusStepper';

import styles from './page.module.css';
import { PrintTemplate } from '../components/PrintTemplate/PrintTemplate';
import SumaryCobranca from '../components/SumaryCobranca/SumaryCobranca';
import { ReceiptTable } from '../components/ReceiptCard/components/ReceiptTable/ReceiptTable';

export default function CobrancaDetalhadaPage() {
  const { id } = useParams();
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    trans, items, loading, error, financial, isLocked,
    shipping, discount, setShipping, tax, setTax,
    newPayment, setNewPayment,
    updateStatus, registrarPagamento, gerarImagem
  } = useCobrancaManager(id as string);

  if (loading && !trans) return <div className={styles.centerInfo}>Sincronizando...</div>;
  if (error || !trans) return <div className={styles.centerInfo}>Erro ao carregar transação.</div>;

  return (
    <div className={styles.screen}>
      <aside className={styles.sidebar}>
        <HeaderPadrao titulo={'Gestão de Cobrança'} />

        <div className={styles.stepperContainer}>
          <StatusStepper currentStatus={trans.status} />
        </div>

        <ControlPanel
          trans={trans}
          shipping={shipping}
          setShipping={setShipping}
          tax={tax}
          setTax={setTax}
          isEditable={!isLocked}
          onUpdateStatus={updateStatus}
          onGerarImagem={() => gerarImagem(cardRef.current)} // Passando o .current puro
          onRegistrarPagamento={registrarPagamento}
          setNewPayment={setNewPayment}
          financial={financial}
          loading={loading}
        />

      </aside>

      <main className={styles.previewArea}>
        {/* <ReceiptCard
            ref={cardRef}
            trans={trans}
            items={items}
            shipping={shipping}
            tax={tax}
            financial={financial}
            /> */}
        <div style={{width:'100%'}}>
          <SumaryCobranca trans={trans} />
          <ReceiptTable items={items} />
        </div>
        <PrintTemplate
          ref={cardRef}
          trans={trans}
          items={items}
          financial={financial}
          shipping={shipping}
          tax={tax}
          discount={discount}
        />
      </main>
    </div>
  );
}