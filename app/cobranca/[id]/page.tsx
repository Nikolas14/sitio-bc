'use client';

import { useRef } from 'react';
import { useParams } from 'next/navigation';
import { useCobrancaManager } from '@/hooks/useCobrancaManager';

import HeaderPadrao from '@/components/HeaderPadrao/HeaderPadrao';
import { ControlPanel } from '../components/ControlPanel/ControlPanel';
import { StatusStepper } from '../components/StatusStepper/StatusStepper';

import styles from './page.module.css';
import { PrintTemplate } from '../components/PrintTemplate/PrintTemplate';
import SumaryCobranca from '../components/SumaryCobranca/SumaryCobranca';
import { ReceiptTable } from '../components/ReceiptCard/components/ReceiptTable/ReceiptTable';
import { PageLayout, Sidebar, Main } from '@/components/PageLayout/PageLayout';
import { useToast } from '@/components/Toast/Toast';

export default function CobrancaDetalhadaPage() {
  const { id } = useParams();
  const cardRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const {
    trans, items, loading, error, financial, isLocked,
    shipping, latamKg, shippingRate, discount, setShipping, setLatamKg, setShippingRate, tax, setTax,
    setNewPayment,
    updateStatus, registrarPagamento, gerarImagem
  } = useCobrancaManager(id as string);

  const onGerarImagem = async () => {
    const ok = await gerarImagem(cardRef.current);
    if (ok) toast.success('Recibo gerado com sucesso!');
    else toast.error('Erro ao gerar imagem do recibo.');
  };

  const onRegistrarPagamento = async () => {
    const ok = await registrarPagamento();
    if (ok) toast.success('Pagamento registrado!');
    else toast.error('Não foi possível registrar o pagamento.');
  };

  if (loading && !trans) return <div className={styles.centerInfo}>Sincronizando...</div>;
  if (error || !trans) return <div className={styles.centerInfo}>Erro ao carregar transação.</div>;

  return (
    <PageLayout>
      <Sidebar>
        <HeaderPadrao titulo={'Gestão de Cobrança'} />

        <div className={styles.stepperContainer}>
          <StatusStepper currentStatus={trans.status} />
        </div>

           <ControlPanel
           trans={trans}
           shipping={shipping}
           setShipping={setShipping}
           latamKg={latamKg}
           setLatamKg={setLatamKg}
           shippingRate={shippingRate}
           setShippingRate={setShippingRate}
          tax={tax}
          setTax={setTax}
          isEditable={!isLocked}
          onUpdateStatus={updateStatus}
          onGerarImagem={onGerarImagem}
          onRegistrarPagamento={onRegistrarPagamento}
          setNewPayment={setNewPayment}
          financial={financial}
          loading={loading}
        />

      </Sidebar>

      <Main className={styles.previewArea}>
        <div style={{ width: '100%' }}>
           <SumaryCobranca trans={trans} shipping={shipping} tax={tax} />
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
      </Main>
    </PageLayout>
  );
}
