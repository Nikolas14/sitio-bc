'use client';

import { useRef } from 'react';
import { useParams } from 'next/navigation';
import { useCobrancaManager } from '@/hooks/useCobrancaManager';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import { ReceiptCard } from '../components/ReceiptCard/ReceiptCard';
import { StatusStepper } from '../components/StatusStepper/StatusStepper';

import styles from './page.module.css';

export default function CobrancaDetalhadaPage() {
  const { id } = useParams();
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    trans, items, loading, error, financial, isLocked,
    shipping, setShipping, tax, setTax,
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
          // Se não for editável, o ControlPanel deve desabilitar os inputs
          isEditable={!isLocked}
          onUpdateStatus={updateStatus}
          onGerarImagem={() => gerarImagem(cardRef.current)} // Passando o .current puro
          onRegistrarPagamento={registrarPagamento}
          setNewPayment={setNewPayment}
        />
      </aside>

      <main className={styles.previewArea}>
        {/* Marca d'água de pagamento se estiver concluído */}
        {trans.status === 'CONCLUIDO' && <div className={styles.paidBadge}>PAGO</div>}
        
        <div className={styles.zoomWrapper}>
          <ReceiptCard
            ref={cardRef}
            trans={trans}
            items={items}
            shipping={shipping}
            tax={tax}
            financial={financial}
          />
        </div>
      </main>
    </div>
  );
}